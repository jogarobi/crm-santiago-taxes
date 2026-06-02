CREATE TABLE `ClientLogin` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`accountId` integer NOT NULL,
	`label` text NOT NULL,
	`username` text NOT NULL,
	`encryptedPassword` text NOT NULL,
	`url` text,
	`notes` text,
	`createdAt` text DEFAULT '(DATETIME(''NOW''))',
	`createdBy` text NOT NULL,
	`updatedAt` text,
	`updatedBy` text,
	FOREIGN KEY (`accountId`) REFERENCES `ClientAccount`(`id`) ON UPDATE no action ON DELETE cascade
);
