ALTER TABLE "templates" ADD COLUMN "mailer_synced_at" text;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "mailer_synced_local_at" timestamp with time zone;--> statement-breakpoint
-- Before the unique index: a user could have two rows linked to one Mailer template before it
-- existed. Keep the link on the most recently updated row and unlink (not delete) the others.
UPDATE "templates" AS t SET "mailer_template_id" = NULL
FROM (
	SELECT "id", row_number() OVER (PARTITION BY "user_id", "mailer_template_id" ORDER BY "updated_at" DESC, "id") AS rn
	FROM "templates" WHERE "mailer_template_id" IS NOT NULL
) AS d
WHERE t."id" = d."id" AND d.rn > 1;--> statement-breakpoint
CREATE UNIQUE INDEX "templates_user_mailer_template_idx" ON "templates" USING btree ("user_id","mailer_template_id") WHERE "templates"."mailer_template_id" IS NOT NULL;