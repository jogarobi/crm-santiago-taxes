CREATE TABLE `Task` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`accountId` integer,
	`businessId` integer,
	`content` text NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`assignedTo` text,
	`createdAt` text DEFAULT 'DATETIME(''NOW'')' NOT NULL,
	`createdBy` text NOT NULL,
	`updatedAt` text,
	`updatedBy` text,
	FOREIGN KEY (`accountId`) REFERENCES `ClientAccount`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON UPDATE no action ON DELETE no action
);
