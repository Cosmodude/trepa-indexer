CREATE TABLE "predictions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"transaction_signature" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"pool_account" varchar(44) NOT NULL,
	"predictor_account" varchar(44) NOT NULL,
	"pool_token_account" varchar(44) NOT NULL,
	"prediction_account" varchar(44) NOT NULL,
	"prediction" numeric(25, 6) NOT NULL,
	"stake" integer NOT NULL,
	"is_fee_payer" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"reward_id" uuid,
	"user_wallet_address" varchar(44) NOT NULL,
	"prediction_account" varchar(44) NOT NULL,
	"amount" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pool_created_event" (
	"id" varchar PRIMARY KEY NOT NULL,
	"transaction_signature" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"pool_account" text NOT NULL,
	"question_id" text NOT NULL,
	"prediction_end_time" text NOT NULL,
	"bump" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pool_finalized_event" (
	"id" varchar PRIMARY KEY NOT NULL,
	"transaction_signature" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"pool_account" text NOT NULL,
	"merkle_root" text NOT NULL,
	"protocol_fee" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_claims_prediction_user" ON "claims" USING btree ("prediction_account","user_wallet_address");
--> statement-breakpoint
CREATE INDEX "idx_claims_user_wallet" ON "claims" USING btree ("user_wallet_address");
--> statement-breakpoint
CREATE INDEX "idx_claims_created_at" ON "claims" USING btree ("created_at");
