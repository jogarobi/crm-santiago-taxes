CREATE TABLE `RolePermission` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role` text NOT NULL,
	`resource` text NOT NULL,
	`action` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT 'DATETIME(''NOW'')',
	`updatedAt` text,
	`updatedBy` text
);
