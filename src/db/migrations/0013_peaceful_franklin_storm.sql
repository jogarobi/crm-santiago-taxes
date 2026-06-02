CREATE TABLE `ClientService` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`accountId` integer NOT NULL,
	`serviceId` integer NOT NULL,
	`createdAt` text DEFAULT '(DATETIME(''NOW''))',
	`createdBy` text NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `ClientAccount`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`serviceId`) REFERENCES `Service`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `client_service_unique` ON `ClientService` (`accountId`,`serviceId`);