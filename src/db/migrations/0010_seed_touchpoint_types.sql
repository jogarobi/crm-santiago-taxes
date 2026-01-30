INSERT INTO ActivityType (name, icon, createdAt, createdBy)
SELECT 'Call', 'Phone', DATETIME('NOW'), 'system'
WHERE NOT EXISTS (SELECT 1 FROM ActivityType WHERE name = 'Call');
--> statement-breakpoint
INSERT INTO ActivityType (name, icon, createdAt, createdBy)
SELECT 'Walk-in', 'User', DATETIME('NOW'), 'system'
WHERE NOT EXISTS (SELECT 1 FROM ActivityType WHERE name = 'Walk-in');
--> statement-breakpoint
INSERT INTO ActivityType (name, icon, createdAt, createdBy)
SELECT 'Appointment', 'Calendar', DATETIME('NOW'), 'system'
WHERE NOT EXISTS (SELECT 1 FROM ActivityType WHERE name = 'Appointment');
--> statement-breakpoint
INSERT INTO ActivityType (name, icon, createdAt, createdBy)
SELECT 'Email', 'Mail', DATETIME('NOW'), 'system'
WHERE NOT EXISTS (SELECT 1 FROM ActivityType WHERE name = 'Email');
