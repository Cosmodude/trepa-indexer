import { schema } from './schema';

export type Prediction = typeof schema.predictionsTable.$inferSelect;
export type NewPrediction = typeof schema.predictionsTable.$inferInsert;

export type Claim = typeof schema.claimsTable.$inferSelect;
export type NewClaim = typeof schema.claimsTable.$inferInsert;

export type HotBlock = typeof schema.hotBlockTable.$inferSelect;
export type NewHotBlock = typeof schema.hotBlockTable.$inferInsert;

export type HotChangeLog = typeof schema.hotChangeLogTable.$inferSelect;
export type NewHotChangeLog = typeof schema.hotChangeLogTable.$inferInsert;

export type Status = typeof schema.statusTable.$inferSelect;
export type NewStatus = typeof schema.statusTable.$inferInsert;
