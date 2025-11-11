import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const accountRelation = sqliteTable('AccountRelation', {
  id: integer().primaryKey({ autoIncrement: true }),
  accountId: integer().references(() => account.id),
  relatedAccountId: integer().references(() => account.id),
  relationship: text().notNull(),
  createdAt: text().default("sql`(DATETIME('NOW'))`"),
  createdBy: text().notNull(),
  updatedAt: text(),
  updatedBy: text(),
});

export const accountContact = sqliteTable('AccountContact', {
  id: integer().primaryKey({ autoIncrement: true }),
  accountId: integer().references(() => account.id),
  email: text(),
  phoneNumber: text(),
  createdAt: text().default("(DATETIME('NOW'))"),
  createdBy: text().notNull(),
  updatedAt: text(),
  updatedBy: text(),
});

export const account = sqliteTable('Account', {
  id: integer().primaryKey({ autoIncrement: true }),
  firstName: text().notNull(),
  lastName: text().notNull(),
  dateOfBirth: text().notNull(),
  ssnLastFour: text(),
  address: text(),
  city: text(),
  state: text(),
  zipCode: text(),
  createdAt: text().default("sql`(DATETIME('now'))`").notNull(),
  createdBy: text().notNull(),
  updatedAt: text(),
  updatedBy: text(),
  squareId: text(),
});

export const businessEntity = sqliteTable('BusinessEntity', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  createdAt: text().default("sql`(DATETIME('NOW'))`"),
  createdBy: text().notNull(),
  updatedAt: text(),
  updatedBy: text(),
});

export const business = sqliteTable('Business', {
  id: integer().primaryKey({ autoIncrement: true }),
  accountId: text()
    .notNull()
    .references(() => account.id),
  registeredName: text().notNull(),
  establishedDate: text(),
  ein: text(),
  createdAt: text().default("(DATETIME(''NOW''))"),
  createdBy: text().notNull(),
  updatedAt: text(),
  updatedBy: text(),
  address: text(),
  entityId: integer().references(() => businessEntity.id),
});

export const activityType = sqliteTable('ActivityType', {
  id: integer().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  icon: text(),
  createdAt: text().default("sql`(DATETIME('NOW'))`"),
  createdBy: text(),
});

export const activity = sqliteTable('Activity', {
  id: integer().primaryKey({ autoIncrement: true }),
  accountId: integer().references(() => account.id),
  typeId: integer()
    .notNull()
    .references(() => activityType.id),
  title: text().notNull(),
  createdAt: text().default("DATETIME('NOW')"),
  createdBy: text().notNull(),
  entity: text(),
  entityId: integer(),
});

export const log = sqliteTable('Log', {
  id: integer().primaryKey({ autoIncrement: true }),
  statusCode: integer(),
  message: text(),
  eventType: text(),
  eventId: text(),
  paylaod: text(),
  createdAt: text().default("sql`(DATETIME('NOW'))`"),
  createdBy: text().notNull(),
});

export const appointment = sqliteTable('Appointment', {
  id: integer().primaryKey({ autoIncrement: true }),
  squareId: text(),
  status: text().notNull(),
  startAt: text().notNull(),
  endAt: text().notNull(),
  durationMinutes: integer(),
  accountId: integer().references(() => account.id),
  creatorType: text().notNull(),
  createdAt: text().default("DATETIME(''NOW'')"),
  createdBy: text(),
  staffId: integer().references(() => staff.id),
  updatedAt: text(),
  updatedBy: text(),
  accountName: text(),
  service: text(),
});

export const staff = sqliteTable('Staff', {
  id: integer().primaryKey({ autoIncrement: true }),
  squareId: text(),
  title: text().notNull(),
  status: text().notNull(),
  firstName: text().notNull(),
  lastName: text().notNull(),
  createdAt: text().default("DATETIME('NOW')"),
  createdBy: text().notNull(),
  updatedAt: text(),
  updatedBy: text(),
});
