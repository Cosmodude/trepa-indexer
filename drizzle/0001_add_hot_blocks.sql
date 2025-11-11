CREATE TABLE "status" (
	"id" integer PRIMARY KEY DEFAULT 0 NOT NULL,
	"height" integer NOT NULL,
	"hash" text NOT NULL,
	"nonce" integer DEFAULT 0 NOT NULL
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
ALTER TABLE "hot_change_log" ADD CONSTRAINT "hot_change_log_block_height_hot_block_height_fk" FOREIGN KEY ("block_height") REFERENCES "public"."hot_block"("height") ON DELETE cascade ON UPDATE no action;

