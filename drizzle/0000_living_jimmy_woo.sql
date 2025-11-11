CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"reward_id" uuid,
	"user_wallet_address" varchar(44) NOT NULL,
	"prediction_account" varchar(44) NOT NULL,
	"amount" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hot_block" (
	"height" integer PRIMARY KEY NOT NULL,
	"hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hot_change_log" (
	"block_height" integer NOT NULL,
	"index" integer NOT NULL,
	"change" jsonb NOT NULL,
	CONSTRAINT "hot_change_log_block_height_index_pk" PRIMARY KEY("block_height","index")
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"transaction_signature" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"pool_account" varchar(44) NOT NULL,
	"predictor_account" varchar(44) NOT NULL,
	"pool_token_account" varchar(44) NOT NULL,
	"prediction_account" varchar(44) NOT NULL,
	"prediction" numeric(25, 6) NOT NULL,
	"stake" bigint NOT NULL,
	"is_fee_payer" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status" (
	"id" integer PRIMARY KEY DEFAULT 0 NOT NULL,
	"height" integer NOT NULL,
	"hash" text NOT NULL,
	"nonce" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hot_change_log" ADD CONSTRAINT "hot_change_log_block_height_hot_block_height_fk" FOREIGN KEY ("block_height") REFERENCES "public"."hot_block"("height") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_claims_prediction_user" ON "claims" USING btree ("prediction_account","user_wallet_address");--> statement-breakpoint
CREATE INDEX "idx_claims_user_wallet" ON "claims" USING btree ("user_wallet_address");--> statement-breakpoint
CREATE INDEX "idx_claims_created_at" ON "claims" USING btree ("created_at");