import {
  text,
  integer,
  sqliteTable,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const clientAccountRelation = sqliteTable('ClientAccountRelation', {
  id: integer().primaryKey({ autoIncrement: true }),
  accountId: integer().references(() => clientAccount.id),
  relatedAccountId: integer().references(() => clientAccount.id),
  relationship: text().notNull(),
  createdAt: text().default("sql`(DATETIME('NOW'))`"),
  createdBy: text().notNull(),
  updatedAt: text(),
  updatedBy: text(),
});

export const clientAccountContact = sqliteTable('ClientAccountContact', {
  id: integer().primaryKey({ autoIncrement: true }),
  accountId: integer().references(() => clientAccount.id),
  email: text(),
  phoneNumber: text(),
  createdAt: text().default("(DATETIME('NOW'))"),
  createdBy: text().notNull(),
  updatedAt: text(),
  updatedBy: text(),
});

export const clientAccount = sqliteTable('ClientAccount', {
  id: integer().primaryKey({ autoIncrement: true }),
  firstName: text().notNull(),
  lastName: text().notNull(),
  dateOfBirth: text().notNull(),
  ssnLastFour: text(),
  address: text(),
  city: text(),
  state: text(),
  zipCode: text(),
  createdBy: text().notNull(),
  updatedAt: text(),
  updatedBy: text(),
  squareId: text(),
  createdAt: text(),
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
    .references(() => clientAccount.id),
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
  accountId: integer().references(() => clientAccount.id),
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

export const staff = sqliteTable('Staff', {
  id: integer().primaryKey({ autoIncrement: true }),
  userId: text().references(() => user.id),
  squareId: text(),
  title: text().notNull(),
  status: text().notNull(),
  firstName: text().notNull(),
  lastName: text().notNull(),
  email: text(),
  createdAt: text().default("DATETIME('NOW')"),
  createdBy: text().notNull(),
  updatedAt: text(),
  updatedBy: text(),
});

export const appointment = sqliteTable('Appointment', {
  id: integer().primaryKey({ autoIncrement: true }),
  squareId: text(),
  status: text().notNull(),
  startAt: text().notNull(),
  endAt: text().notNull(),
  durationMinutes: integer(),
  accountId: integer().references(() => clientAccount.id),
  creatorType: text().notNull(),
  createdAt: text().default("DATETIME(''''NOW'''')"),
  createdBy: text(),
  staffId: integer().references(() => staff.id),
  updatedAt: text(),
  updatedBy: text(),
  accountName: text(),
  service: text(),
  accountSquareId: text().notNull(),
});

export const note = sqliteTable('Note', {
  id: integer().primaryKey(),
  accountId: integer().references(() => clientAccount.id),
  content: text(),
  createdBy: text().notNull(),
  createdAt: text().notNull(),
  updatedBy: text(),
  updatedAt: text(),
});

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .default(false)
    .notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    activeOrganizationId: text('active_organization_id'),
  },
  (table) => [index('session_userId_idx').on(table.userId)]
);

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)]
);

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)]
);

export const organization = sqliteTable(
  'organization',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    logo: text('logo'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    metadata: text('metadata'),
  },
  (table) => [uniqueIndex('organization_slug_uidx').on(table.slug)]
);

export const member = sqliteTable(
  'member',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').default('member').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('member_organizationId_idx').on(table.organizationId),
    index('member_userId_idx').on(table.userId),
  ]
);

export const invitation = sqliteTable(
  'invitation',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: text('role'),
    status: text('status').default('pending').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('invitation_organizationId_idx').on(table.organizationId),
    index('invitation_email_idx').on(table.email),
  ]
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  members: many(member),
  invitations: many(invitation),
  staffProfile: one(staff, {
    fields: [user.id],
    references: [staff.userId],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
}));

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

export const staffRelations = relations(staff, ({ one }) => ({
  user: one(user, {
    fields: [staff.userId],
    references: [user.id],
  }),
}));
