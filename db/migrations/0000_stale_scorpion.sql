-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `AccountRelation` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`accountId` integer,
	`relatedAccountId` integer,
	`relationship` text NOT NULL,
	`createdAt` text DEFAULT (DATETIME('NOW')),
	`createdBy` text NOT NULL,
	`updatedAt` text,
	`updatedBy` text,
	FOREIGN KEY (`relatedAccountId`) REFERENCES `Account`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `AccountContact` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`accountId` integer,
	`email` text,
	`phoneNumber` text,
	`createdAt` text DEFAULT '(DATETIME(''NOW''))',
	`createdBy` text NOT NULL,
	`updatedAt` text,
	`updatedBy` text,
	FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Business` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`accountId` text NOT NULL,
	`registeredName` text NOT NULL,
	`establishedDate` text,
	`ein` text,
	`createdAt` text DEFAULT '(DATETIME(''NOW''))',
	`createdBy` text NOT NULL,
	`updatedAt` text,
	`updatedBy` text,
	FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `Account` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`firstName` text NOT NULL,
	`lastName` text NOT NULL,
	`dateOfBirth` text NOT NULL,
	`ssnLastFour` text,
	`address` text,
	`city` text,
	`state` text,
	`zipCode` text,
	`createdAt` text DEFAULT (DATETIME('now')) NOT NULL,
	`createdBy` text NOT NULL,
	`updatedAt` text,
	`updatedBy` text,
	`squareId` text
);

*/