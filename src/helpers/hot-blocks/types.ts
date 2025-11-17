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

export interface DBChange {
  type: 'insert' | 'update' | 'delete';
  table: string;
  entity: any;
  oldEntity?: any;
  key?: any;
}
