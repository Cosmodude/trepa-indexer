import type { DatabaseTransaction } from '../database-types';
import { NewHotChangeLog, schema } from '../../drizzle';
import type { DBChange } from './types';

export class ChangeTracker {
  constructor(
    public tx: DatabaseTransaction,
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

  async recordUpdate(
    table: string,
    entity: any,
    oldEntity: any,
    key: any,
  ): Promise<void> {
    this.changes.push({
      type: 'update',
      table,
      entity,
      oldEntity,
      key,
    });
  }

  async recordDelete(table: string, entity: any, key: any): Promise<void> {
    this.changes.push({
      type: 'delete',
      table,
      entity,
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
      await this.tx.insert(schema.hotChangeLogTable).values(changeLogs);
    }
  }
}
