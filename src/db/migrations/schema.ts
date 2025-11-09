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
