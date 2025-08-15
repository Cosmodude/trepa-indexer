module.exports = class Data1755234493597 {
    name = 'Data1755234493597'

    async up(db) {
        await db.query(`CREATE TABLE "trepa_event" ("id" character varying NOT NULL, "transaction_signature" text NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "pool_account" text NOT NULL, "predictor" text NOT NULL, "pool_token_account" text NOT NULL, "prediction_account" text NOT NULL, "stake" text NOT NULL, "fee_payer" text NOT NULL, CONSTRAINT "PK_d6bc3b34f1a45f201ad1996a9d1" PRIMARY KEY ("id"))`)
    }

    async down(db) {
        await db.query(`DROP TABLE "trepa_event"`)
    }
}
