CREATE TABLE "claimed_event" (
	"id" varchar PRIMARY KEY NOT NULL,
	"transaction_signature" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"pool_account" text NOT NULL,
	"predictor" text NOT NULL,
	"pool_token_account" text NOT NULL,
	"prediction_account" text NOT NULL,
	"amount" text NOT NULL,
	"proof" text NOT NULL
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
CREATE TABLE "predicted_event" (
	"id" varchar PRIMARY KEY NOT NULL,
	"transaction_signature" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"pool_account" text NOT NULL,
	"predictor" text NOT NULL,
	"pool_token_account" text NOT NULL,
	"prediction_account" text NOT NULL,
	"stake" text NOT NULL,
	"fee_payer" text NOT NULL
);
