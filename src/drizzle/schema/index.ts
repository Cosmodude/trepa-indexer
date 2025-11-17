import * as claims from './claims.sql';
import * as hotBlocks from './hot-block.sql';
import * as hotChangeLogs from './hot-change-log.sql';
import * as predictions from './predictions.sql';
import * as statuses from './status.sql';

export const schema = {
  ...predictions,
  ...claims,
  ...hotBlocks,
  ...hotChangeLogs,
  ...statuses,
};
