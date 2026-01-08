ALTER TABLE `Staff` ADD `userId` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `Staff` ADD `email` text;