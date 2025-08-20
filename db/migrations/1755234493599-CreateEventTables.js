module.exports = class CreateEventTables1755234493599 {
    name = 'CreateEventTables1755234493599'

    async up(db) {
        // Create predicted_event table
        await db.query(`CREATE TABLE "predicted_event" ("id" character varying NOT NULL, "transaction_signature" text NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "pool_account" text NOT NULL, "predictor" text NOT NULL, "pool_token_account" text NOT NULL, "prediction_account" text NOT NULL, "stake" text NOT NULL, "fee_payer" text NOT NULL, CONSTRAINT "PK_predicted_event" PRIMARY KEY ("id"))`)
        
        // Create claimed_event table
        await db.query(`CREATE TABLE "claimed_event" ("id" character varying NOT NULL, "transaction_signature" text NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "pool_account" text NOT NULL, "predictor" text NOT NULL, "pool_token_account" text NOT NULL, "prediction_account" text NOT NULL, "amount" text NOT NULL, "proof" text NOT NULL, CONSTRAINT "PK_claimed_event" PRIMARY KEY ("id"))`)
        
        // Create pool_created_event table
        await db.query(`CREATE TABLE "pool_created_event" ("id" character varying NOT NULL, "transaction_signature" text NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "pool_account" text NOT NULL, "question_id" text NOT NULL, "prediction_end_time" text NOT NULL, "bump" text NOT NULL, CONSTRAINT "PK_pool_created_event" PRIMARY KEY ("id"))`)
        
        // Create pool_finalized_event table
        await db.query(`CREATE TABLE "pool_finalized_event" ("id" character varying NOT NULL, "transaction_signature" text NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "pool_account" text NOT NULL, "merkle_root" text NOT NULL, "protocol_fee" text NOT NULL, CONSTRAINT "PK_pool_finalized_event" PRIMARY KEY ("id"))`)
    }

    async down(db) {
        await db.query(`DROP TABLE "pool_finalized_event"`)
        await db.query(`DROP TABLE "pool_created_event"`)
        await db.query(`DROP TABLE "claimed_event"`)
        await db.query(`DROP TABLE "predicted_event"`)
    }
}
