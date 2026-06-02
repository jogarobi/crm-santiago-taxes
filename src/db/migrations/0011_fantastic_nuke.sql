CREATE TABLE `BusinessAccount` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`businessId` integer NOT NULL,
	`accountId` integer NOT NULL,
	`createdAt` text DEFAULT '(DATETIME(''NOW''))',
	`createdBy` text NOT NULL,
	FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`accountId`) REFERENCES `ClientAccount`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `business_account_unique` ON `BusinessAccount` (`businessId`,`accountId`);--> statement-breakpoint
ALTER TABLE `ClientAccount` ADD `flag` text;--> statement-breakpoint
INSERT INTO `BusinessAccount` (`businessId`, `accountId`, `createdBy`)
SELECT `id`, CAST(`accountId` AS INTEGER), `createdBy`
FROM `Business`
WHERE `accountId` IS NOT NULL AND CAST(`accountId` AS INTEGER) > 0;