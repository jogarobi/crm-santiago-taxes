CREATE TABLE `Service` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT 'DATETIME(''NOW'')' NOT NULL,
	`createdBy` text NOT NULL,
	`updatedAt` text,
	`updatedBy` text
);
--> statement-breakpoint
ALTER TABLE `Activity` ADD `businessId` integer REFERENCES Business(id);