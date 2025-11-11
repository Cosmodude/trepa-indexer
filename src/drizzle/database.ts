import assert from 'assert';
import { gte, sql } from 'drizzle-orm';

import { START_BLOCK_HEIGHT } from '../config';
import {
  insertRecords,
  upsertRecords,
  updateRecords,
  deleteRecords,
} from './crud-operations';
import type {
  DatabaseTransaction,
  DatabaseRecord,
  StoreCallback,
  TransactionInfo,
} from './database-types';
import { db } from './db';
import {
  insertHotBlock,
  deleteHotBlocks,
  updateStatus,
  applyRollbackChange,
  rollbackBlock,
  last,
  maybeLast,
  assertChainContinuity,
  RACE_MSG,
  ChangeTracker,
  type HashAndHeight,
  type DatabaseState,
  type HotTxInfo,
  type DBChange,
} from './hot-blocks';
import { hotBlock, hotChangeLog, status } from './schema';
import { performUpdates } from './store-factory';

export type { HashAndHeight, DatabaseState, HotTxInfo } from './hot-blocks';

export class DrizzleDatabase {
  public supportsHotBlocks = true;

  async connect(): Promise<DatabaseState> {
    await this.initializeStatus();
    const state = await this.getState(db);
    return state;
  }

  private async initializeStatus(): Promise<void> {
    const existingStatus = await db.select().from(status).limit(1);

    if (existingStatus.length === 0) {
      await db.insert(status).values({
        id: 0,
        height: START_BLOCK_HEIGHT - 1,
        hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        nonce: 0,
      });
    }
  }

  async insert(records: DatabaseRecord[]): Promise<void> {
    return insertRecords(db as DatabaseTransaction, records);
  }

  async upsert(records: DatabaseRecord[]): Promise<void> {
    return upsertRecords(db as DatabaseTransaction, records);
  }

  async update(records: DatabaseRecord[]): Promise<void> {
    return updateRecords(db as DatabaseTransaction, records);
  }

  async delete(records: DatabaseRecord[]): Promise<void> {
    return deleteRecords(db as DatabaseTransaction, records);
  }

  async transact(info: TransactionInfo, cb: StoreCallback): Promise<void> {
    await cb(this);
  }

  async transactHot(
    info: HotTxInfo,
    cb: (
      store: ReturnType<typeof import('./store-factory').createStore>,
      block: HashAndHeight,
    ) => Promise<void>,
  ): Promise<void> {
    return this.transactHot2(info, async (store, sliceBeg, sliceEnd) => {
      for (let i = sliceBeg; i < sliceEnd; i++) {
        await cb(store, info.newBlocks[i]);
      }
    });
  }

  async transactHot2(
    info: HotTxInfo,
    cb: (
      store: ReturnType<typeof import('./store-factory').createStore>,
      sliceBeg: number,
      sliceEnd: number,
    ) => Promise<void>,
  ): Promise<void> {
    return this.submit(async (tx: DatabaseTransaction) => {
      const state = await this.getState(tx);
      let chain = [{ height: state.height, hash: state.hash }, ...state.top];

      assertChainContinuity(info.baseHead, info.newBlocks);
      assert(
        info.finalizedHead.height <=
          (maybeLast(info.newBlocks) ?? info.baseHead).height,
      );

      if (!chain.find((b) => b.hash === info.baseHead.hash)) {
        throw new Error(RACE_MSG);
      }

      if (info.newBlocks.length === 0) {
        const chainLast = last(chain);
        if (!chainLast) {
          throw new Error('Chain is unexpectedly empty');
        }
        if (chainLast.hash !== info.baseHead.hash) {
          throw new Error(RACE_MSG);
        }
      }

      if (chain.length === 0 || chain[0].height > info.finalizedHead.height) {
        throw new Error(RACE_MSG);
      }

      const cutoff = info.baseHead.height + 1;
      const logs = await tx
        .select()
        .from(hotChangeLog)
        .where(gte(hotChangeLog.blockHeight, cutoff))
        .orderBy(
          sql`${hotChangeLog.blockHeight} DESC, ${hotChangeLog.index} DESC`,
        );

      for (const changeLog of logs) {
        await applyRollbackChange(tx, changeLog.change as DBChange);
      }

      if (logs.length > 0) {
        await tx
          .delete(hotChangeLog)
          .where(gte(hotChangeLog.blockHeight, cutoff));
        await tx.delete(hotBlock).where(gte(hotBlock.height, cutoff));
      }

      if (info.newBlocks.length) {
        let finalizedEnd = 0;
        while (
          finalizedEnd < info.newBlocks.length &&
          info.newBlocks[finalizedEnd].height <= info.finalizedHead.height
        ) {
          finalizedEnd++;
        }

        if (finalizedEnd > 0) {
          await performUpdates((store) => cb(store, 0, finalizedEnd), tx);
        }

        for (let i = finalizedEnd; i < info.newBlocks.length; i++) {
          const b = info.newBlocks[i];
          await insertHotBlock(tx, b);
          await performUpdates(
            (store) => cb(store, i, i + 1),
            tx,
            new ChangeTracker(tx, this.getStatusSchema(), b.height),
          );
        }
      }

      chain = chain.filter((b) => b.height < cutoff).concat(info.newBlocks);

      if (chain.length === 0) {
        throw new Error('Chain is empty after processing');
      }

      let finalizedHeadPos = -1;
      for (let i = chain.length - 1; i >= 0; i--) {
        if (chain[i].height <= info.finalizedHead.height) {
          finalizedHeadPos = i;
          break;
        }
      }

      if (finalizedHeadPos === -1) {
        throw new Error(
          `No block found at or before finalized head height ${info.finalizedHead.height} in chain (chain heights: ${chain[0]?.height} to ${chain[chain.length - 1]?.height}, length: ${chain.length})`,
        );
      }

      const actualFinalizedHead = chain[finalizedHeadPos];

      await deleteHotBlocks(tx, actualFinalizedHead.height);
      await updateStatus(tx, state.nonce, actualFinalizedHead);
    });
  }

  private getStatusSchema(): string {
    return 'public';
  }

  async submit<T>(fn: (tx: DatabaseTransaction) => Promise<T>): Promise<T> {
    const maxRetries = 10;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await db.transaction(async (tx) => {
          return await fn(tx as DatabaseTransaction);
        });
      } catch (error: unknown) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          error.code === '40001'
        ) {
          attempt++;
          if (attempt >= maxRetries) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Transaction failed after maximum retries');
  }

  async getState(tx: DatabaseTransaction): Promise<DatabaseState> {
    const statusRow = await tx.select().from(status).limit(1);
    const hotBlocks = await tx.select().from(hotBlock).orderBy(hotBlock.height);

    if (statusRow.length === 0) {
      return {
        height: START_BLOCK_HEIGHT - 1,
        hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        nonce: 0,
        top: [],
      };
    }

    return {
      height: statusRow[0].height,
      hash: statusRow[0].hash,
      nonce: statusRow[0].nonce,
      top: hotBlocks.map((b: any) => ({ height: b.height, hash: b.hash })),
    };
  }

  async rollbackBlock(
    tx: DatabaseTransaction,
    blockHeight: number,
  ): Promise<void> {
    await rollbackBlock(tx, blockHeight);
  }
}
