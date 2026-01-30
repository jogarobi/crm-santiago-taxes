-- Update existing 'Appointment Booked' activity type to 'Appointment'
UPDATE ActivityType
SET name = 'Appointment'
WHERE name = 'Appointment Booked';
