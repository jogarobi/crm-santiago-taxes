ALTER TABLE `ClientAccountContact` RENAME COLUMN "email" TO "contactType";--> statement-breakpoint
ALTER TABLE `ClientAccountContact` RENAME COLUMN "phoneNumber" TO "contactValue";--> statement-breakpoint
DROP INDEX "account_userId_idx";--> statement-breakpoint
DROP INDEX "invitation_email_idx";--> statement-breakpoint
DROP INDEX "invitation_organizationId_idx";--> statement-breakpoint
DROP INDEX "member_userId_idx";--> statement-breakpoint
DROP INDEX "member_organizationId_idx";--> statement-breakpoint
DROP INDEX "organization_slug_uidx";--> statement-breakpoint
DROP INDEX "organization_slug_unique";--> statement-breakpoint
DROP INDEX "session_userId_idx";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
DROP INDEX "verification_identifier_idx";--> statement-breakpoint
ALTER TABLE `ClientAccountContact` ALTER COLUMN "contactType" TO "contactType" text NOT NULL;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `invitation_email_idx` ON `invitation` (`email`);--> statement-breakpoint
CREATE INDEX `invitation_organizationId_idx` ON `invitation` (`organization_id`);--> statement-breakpoint
CREATE INDEX `member_userId_idx` ON `member` (`user_id`);--> statement-breakpoint
CREATE INDEX `member_organizationId_idx` ON `member` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_uidx` ON `organization` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
ALTER TABLE `ClientAccountContact` ALTER COLUMN "contactValue" TO "contactValue" text NOT NULL;