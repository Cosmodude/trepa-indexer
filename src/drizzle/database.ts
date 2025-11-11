import assert from 'assert';
import { eq, lt, and, sql } from 'drizzle-orm';

import { START_BLOCK_HEIGHT } from '../config';
import { db } from './db';
import {
  predictions,
  claims,
  hotBlock,
  hotChangeLog,
  status,
  type NewPrediction,
  type NewClaim,
  type NewHotChangeLog,
} from './schema';

export type HashAndHeight = { height: number; hash: string };
export type DatabaseState = HashAndHeight & {
  nonce: number;
  top: HashAndHeight[];
};
export type HotTxInfo = {
  baseHead: HashAndHeight;
  finalizedHead: HashAndHeight;
  newBlocks: HashAndHeight[];
};

interface DBChange {
  type: 'insert' | 'update' | 'delete';
  table: string;
  entity: any;
  key?: any;
}

export class ChangeTracker {
  constructor(
    public tx: any,
    public schema: string,
    public blockHeight: number,
  ) {}

  private changes: DBChange[] = [];

  async recordInsert(table: string, entity: any): Promise<void> {
    this.changes.push({
      type: 'insert',
      table,
      entity,
    });
  }

  async recordUpdate(table: string, entity: any, key: any): Promise<void> {
    this.changes.push({
      type: 'update',
      table,
      entity,
      key,
    });
  }

  async recordDelete(table: string, key: any): Promise<void> {
    this.changes.push({
      type: 'delete',
      table,
      entity: null,
      key,
    });
  }

  async persist(): Promise<void> {
    const changeLogs: NewHotChangeLog[] = this.changes.map((change, idx) => ({
      blockHeight: this.blockHeight,
      index: idx,
      change: change as any,
    }));

    if (changeLogs.length > 0) {
      await this.tx.insert(hotChangeLog).values(changeLogs);
    }
  }
}

const RACE_MSG =
  'status table was updated by foreign process, make sure no other processor is running';

function last<T>(arr: T[]): T | undefined {
  return arr.length ? arr[arr.length - 1] : undefined;
}

function maybeLast<T>(arr?: T[]): T | undefined {
  return arr ? last(arr) : undefined;
}

function assertChainContinuity(base: HashAndHeight, chain: HashAndHeight[]) {
  let prev = base;
  for (const b of chain) {
    assert(b.height === prev.height + 1, 'blocks must form a continues chain');
    prev = b;
  }
}

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

  async insert(records: any[]): Promise<void> {
    if (records.length === 0) return;

    const predictedEvents: NewPrediction[] = [];
    const claimedEvents: NewClaim[] = [];

    for (const record of records) {
      if (record instanceof Object && 'stake' in record) {
        predictedEvents.push(record as NewPrediction);
      } else if (record instanceof Object && 'amount' in record) {
        claimedEvents.push(record as NewClaim);
      }
    }

    if (predictedEvents.length > 0) {
      await db.insert(predictions).values(predictedEvents);
    }
    if (claimedEvents.length > 0) {
      await db.insert(claims).values(claimedEvents);
    }
  }

  async upsert(records: any[]): Promise<void> {
    if (records.length === 0) return;

    const predictedEvents: NewPrediction[] = [];
    const claimedEvents: NewClaim[] = [];

    for (const record of records) {
      if (record instanceof Object && 'stake' in record) {
        predictedEvents.push(record as NewPrediction);
      } else if (record instanceof Object && 'amount' in record) {
        claimedEvents.push(record as NewClaim);
      }
    }

    if (predictedEvents.length > 0) {
      await db
        .insert(predictions)
        .values(predictedEvents)
        .onConflictDoNothing();
    }
    if (claimedEvents.length > 0) {
      await db.insert(claims).values(claimedEvents).onConflictDoNothing();
    }
  }

  async update(_records: any[]): Promise<void> {
    throw new Error('Update not implemented yet');
  }

  async delete(_records: any[]): Promise<void> {
    throw new Error('Delete not implemented yet');
  }

  async transact(info: any, cb: (store: any) => Promise<void>): Promise<void> {
    await cb(this);
  }

  async transactHot(
    info: HotTxInfo,
    cb: (store: any, block: HashAndHeight) => Promise<void>,
  ): Promise<void> {
    return this.transactHot2(info, async (store, sliceBeg, sliceEnd) => {
      for (let i = sliceBeg; i < sliceEnd; i++) {
        await cb(store, info.newBlocks[i]);
      }
    });
  }

  async transactHot2(
    info: HotTxInfo,
    cb: (store: any, sliceBeg: number, sliceEnd: number) => Promise<void>,
  ): Promise<void> {
    return this.submit(async (tx) => {
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
        if (last(chain)!.hash !== info.baseHead.hash) throw new Error(RACE_MSG);
      }

      if (!(chain[0].height <= info.finalizedHead.height))
        throw new Error(RACE_MSG);

      const rollbackPos = info.baseHead.height + 1 - chain[0].height;

      for (let i = chain.length - 1; i >= rollbackPos; i--) {
        await this.rollbackBlock(this.getStatusSchema(), tx, chain[i].height);
      }

      if (info.newBlocks.length) {
        let finalizedEnd =
          info.finalizedHead.height - info.newBlocks[0].height + 1;
        if (finalizedEnd > 0) {
          await this.performUpdates((store) => cb(store, 0, finalizedEnd), tx);
        } else {
          finalizedEnd = 0;
        }

        for (let i = finalizedEnd; i < info.newBlocks.length; i++) {
          const b = info.newBlocks[i];
          await this.insertHotBlock(tx, b);
          await this.performUpdates(
            (store) => cb(store, i, i + 1),
            tx,
            new ChangeTracker(tx, this.getStatusSchema(), b.height),
          );
        }
      }

      chain = chain.slice(0, rollbackPos).concat(info.newBlocks);
      const finalizedHeadPos = info.finalizedHead.height - chain[0].height;

      if (chain[finalizedHeadPos].hash !== info.finalizedHead.hash) {
        throw new Error('finalized head mismatch');
      }

      await this.deleteHotBlocks(tx, info.finalizedHead.height);
      await this.updateStatus(tx, state.nonce, info.finalizedHead);
    });
  }

  private getStatusSchema(): string {
    return 'public';
  }

  async submit<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    const maxRetries = 10;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        return await db.transaction(async (tx: any) => {
          return await fn(tx);
        });
      } catch (error: any) {
        if (error.code === '40001') {
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

  async getState(tx: any): Promise<DatabaseState> {
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

  async performUpdates(
    cb: (store: any) => Promise<void>,
    tx: any,
    changeTracker?: ChangeTracker,
  ): Promise<void> {
    const running = { value: true };
    const store = {
      insert: async (records: any[]) => {
        if (!running.value) throw new Error('too late to perform db updates');

        if (records.length === 0) return;

        const predictedEvents: NewPrediction[] = [];
        const claimedEvents: NewClaim[] = [];

        for (const record of records) {
          if (record instanceof Object && 'stake' in record) {
            predictedEvents.push(record as NewPrediction);
            if (changeTracker) {
              await changeTracker.recordInsert('predictions', record);
            }
          } else if (record instanceof Object && 'amount' in record) {
            claimedEvents.push(record as NewClaim);
            if (changeTracker) {
              await changeTracker.recordInsert('claims', record);
            }
          }
        }

        if (predictedEvents.length > 0) {
          await tx.insert(predictions).values(predictedEvents);
        }
        if (claimedEvents.length > 0) {
          await tx.insert(claims).values(claimedEvents);
        }
      },
      upsert: async (records: any[]) => {
        if (!running.value) throw new Error('too late to perform db updates');

        if (records.length === 0) return;

        const predictedEvents: NewPrediction[] = [];
        const claimedEvents: NewClaim[] = [];

        for (const record of records) {
          if (record instanceof Object && 'stake' in record) {
            predictedEvents.push(record as NewPrediction);
            if (changeTracker) {
              await changeTracker.recordInsert('predictions', record);
            }
          } else if (record instanceof Object && 'amount' in record) {
            claimedEvents.push(record as NewClaim);
            if (changeTracker) {
              await changeTracker.recordInsert('claims', record);
            }
          }
        }

        if (predictedEvents.length > 0) {
          await tx
            .insert(predictions)
            .values(predictedEvents)
            .onConflictDoNothing();
        }
        if (claimedEvents.length > 0) {
          await tx.insert(claims).values(claimedEvents).onConflictDoNothing();
        }
      },
      update: async (_records: any[]) => {
        if (!running.value) throw new Error('too late to perform db updates');
        throw new Error('Update not implemented yet');
      },
      delete: async (_records: any[]) => {
        if (!running.value) throw new Error('too late to perform db updates');
        throw new Error('Delete not implemented yet');
      },
    };

    try {
      await cb(store);
      if (changeTracker) {
        await changeTracker.persist();
      }
    } finally {
      running.value = false;
    }
  }

  async insertHotBlock(tx: any, block: HashAndHeight): Promise<void> {
    await tx
      .insert(hotBlock)
      .values({
        height: block.height,
        hash: block.hash,
      })
      .onConflictDoNothing();
  }

  async deleteHotBlocks(tx: any, finalizedHeight: number): Promise<void> {
    await tx.delete(hotBlock).where(lt(hotBlock.height, finalizedHeight));
  }

  async updateStatus(
    tx: any,
    nonce: number,
    next: HashAndHeight,
  ): Promise<void> {
    const result = await tx
      .update(status)
      .set({
        height: next.height,
        hash: next.hash,
        nonce: nonce + 1,
      })
      .where(and(eq(status.id, 0), eq(status.nonce, nonce)))
      .returning();

    if (result.length === 0) {
      throw new Error(RACE_MSG);
    }
  }

  async rollbackBlock(
    schema: string,
    tx: any,
    blockHeight: number,
  ): Promise<void> {
    const changes = await tx
      .select()
      .from(hotChangeLog)
      .where(eq(hotChangeLog.blockHeight, blockHeight))
      .orderBy(sql`${hotChangeLog.index} DESC`);

    for (const changeLog of changes) {
      const change = changeLog.change as DBChange;

      switch (change.type) {
        case 'insert':
          if (change.table === 'predictions') {
            await tx
              .delete(predictions)
              .where(eq(predictions.id, change.entity.id));
          } else if (change.table === 'claims') {
            await tx.delete(claims).where(eq(claims.id, change.entity.id));
          }
          break;
        case 'update':
          break;
        case 'delete':
          break;
      }
    }

    await tx.delete(hotBlock).where(eq(hotBlock.height, blockHeight));
  }
}
