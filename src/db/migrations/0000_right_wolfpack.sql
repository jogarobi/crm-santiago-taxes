CREATE TABLE IF NOT EXISTS `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `Activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`accountId` integer,
	`typeId` integer NOT NULL,
	`title` text NOT NULL,
	`createdAt` text DEFAULT 'DATETIME(''NOW'')',
	`createdBy` text NOT NULL,
	`entity` text,
	`entityId` integer,
	FOREIGN KEY (`accountId`) REFERENCES `ClientAccount`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`typeId`) REFERENCES `ActivityType`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ActivityType` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`createdAt` text DEFAULT 'sql`(DATETIME(''NOW''))`',
	`createdBy` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `Appointment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`squareId` text,
	`status` text NOT NULL,
	`startAt` text NOT NULL,
	`endAt` text NOT NULL,
	`durationMinutes` integer,
	`accountId` integer,
	`creatorType` text NOT NULL,
	`createdAt` text DEFAULT 'DATETIME(''''''''NOW'''''''')',
	`createdBy` text,
	`staffId` integer,
	`updatedAt` text,
	`updatedBy` text,
	`accountName` text,
	`service` text,
	`accountSquareId` text NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `ClientAccount`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `Business` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`accountId` text NOT NULL,
	`registeredName` text NOT NULL,
	`establishedDate` text,
	`ein` text,
	`createdAt` text DEFAULT '(DATETIME(''''NOW''''))',
	`createdBy` text NOT NULL,
	`updatedAt` text,
	`updatedBy` text,
	`address` text,
	`entityId` integer,
	FOREIGN KEY (`accountId`) REFERENCES `ClientAccount`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`entityId`) REFERENCES `BusinessEntity`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `BusinessEntity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` text DEFAULT 'sql`(DATETIME(''NOW''))`',
	`createdBy` text NOT NULL,
	`updatedAt` text,
	`updatedBy` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ClientAccount` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`dateOfBirth` text NOT NULL,
	`ssnLastFour` text,
	`address` text,
	`city` text,
	`state` text,
	`zipCode` text,
	`createdBy` text NOT NULL,
	`updatedAt` text,
	`updatedBy` text,
	`squareId` text,
	`createdAt` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ClientAccountContact` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`accountId` integer,
	`email` text,
	`phoneNumber` text,
	`createdAt` text DEFAULT '(DATETIME(''NOW''))',
	`createdBy` text NOT NULL,
	`updatedAt` text,
	`updatedBy` text,
	FOREIGN KEY (`accountId`) REFERENCES `ClientAccount`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `ClientAccountRelation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`accountId` integer,
	`relatedAccountId` integer,
	`relationship` text NOT NULL,
	`createdAt` text DEFAULT 'sql`(DATETIME(''NOW''))`',
	`createdBy` text NOT NULL,
	`updatedAt` text,
	`updatedBy` text,
	FOREIGN KEY (`accountId`) REFERENCES `ClientAccount`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`relatedAccountId`) REFERENCES `ClientAccount`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`inviter_id` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `invitation_organizationId_idx` ON `invitation` (`organization_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `invitation_email_idx` ON `invitation` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `Log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`statusCode` integer,
	`message` text,
	`eventType` text,
	`eventId` text,
	`paylaod` text,
	`createdAt` text DEFAULT 'sql`(DATETIME(''NOW''))`',
	`createdBy` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `member` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `member_organizationId_idx` ON `member` (`organization_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `member_userId_idx` ON `member` (`user_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `Note` (
	`id` integer PRIMARY KEY NOT NULL,
	`accountId` integer,
	`content` text,
	`createdBy` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedBy` text,
	`updatedAt` text,
	FOREIGN KEY (`accountId`) REFERENCES `ClientAccount`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `organization` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`logo` text,
	`created_at` integer NOT NULL,
	`metadata` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `organization_slug_uidx` ON `organization` (`slug`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`active_organization_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `Staff` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`squareId` text,
	`title` text NOT NULL,
	`status` text NOT NULL,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`createdAt` text DEFAULT 'DATETIME(''NOW'')',
	`createdBy` text NOT NULL,
	`updatedAt` text,
	`updatedBy` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `verification_identifier_idx` ON `verification` (`identifier`);