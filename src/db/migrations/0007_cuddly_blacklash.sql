PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_Note` (
	`id` integer PRIMARY KEY NOT NULL,
	`accountId` integer,
	`businessId` integer,
	`content` text,
	`createdBy` text NOT NULL,
	`createdAt` text NOT NULL,
	`updatedBy` text,
	`updatedAt` text,
	FOREIGN KEY (`accountId`) REFERENCES `ClientAccount`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_Note`("id", "accountId", "businessId", "content", "createdBy", "createdAt", "updatedBy", "updatedAt") SELECT "id", "accountId", "businessId", "content", "createdBy", "createdAt", "updatedBy", "updatedAt" FROM `Note`;--> statement-breakpoint
DROP TABLE `Note`;--> statement-breakpoint
ALTER TABLE `__new_Note` RENAME TO `Note`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `Business` ADD `city` text;--> statement-breakpoint
ALTER TABLE `Business` ADD `state` text;--> statement-breakpoint
ALTER TABLE `Business` ADD `zipCode` text;