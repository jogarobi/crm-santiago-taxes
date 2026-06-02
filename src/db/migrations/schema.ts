import { sqliteTable, AnySQLiteColumn, foreignKey, integer, text, index, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const clientAccountRelation = sqliteTable("ClientAccountRelation", {
	id: integer().primaryKey({ autoIncrement: true }),
	accountId: integer().references(() => clientAccount.id),
	relatedAccountId: integer().references(() => clientAccount.id),
	relationship: text().notNull(),
	createdAt: text().default("sql`(DATETIME('NOW'))`"),
	createdBy: text().notNull(),
	updatedAt: text(),
	updatedBy: text(),
});

export const clientAccount = sqliteTable("ClientAccount", {
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
	flag: text(),
});

export const businessEntity = sqliteTable("BusinessEntity", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	createdAt: text().default("sql`(DATETIME('NOW'))`"),
	createdBy: text().notNull(),
	updatedAt: text(),
	updatedBy: text(),
});

export const business = sqliteTable("Business", {
	id: integer().primaryKey({ autoIncrement: true }),
	accountId: text().notNull().references(() => clientAccount.id),
	registeredName: text().notNull(),
	establishedDate: text(),
	ein: text(),
	createdAt: text().default("(DATETIME(''NOW''))"),
	createdBy: text().notNull(),
	updatedAt: text(),
	updatedBy: text(),
	address: text(),
	entityId: integer().references(() => businessEntity.id),
	city: text(),
	state: text(),
	zipCode: text(),
});

export const activityType = sqliteTable("ActivityType", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	icon: text(),
	createdAt: text().default("sql`(DATETIME('NOW'))`"),
	createdBy: text(),
});

export const activity = sqliteTable("Activity", {
	id: integer().primaryKey({ autoIncrement: true }),
	accountId: integer().references(() => clientAccount.id),
	typeId: integer().notNull().references(() => activityType.id),
	title: text().notNull(),
	createdAt: text().default("DATETIME('NOW')"),
	createdBy: text().notNull(),
	entity: text(),
	entityId: integer(),
	businessId: integer().references(() => business.id),
});

export const log = sqliteTable("Log", {
	id: integer().primaryKey({ autoIncrement: true }),
	statusCode: integer(),
	message: text(),
	eventType: text(),
	eventId: text(),
	paylaod: text(),
	createdAt: text().default("sql`(DATETIME('NOW'))`"),
	createdBy: text().notNull(),
});

export const staff = sqliteTable("Staff", {
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
	userId: text().references(() => user.id),
	email: text(),
});

export const appointment = sqliteTable("Appointment", {
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

export const account = sqliteTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at"),
	refreshTokenExpiresAt: integer("refresh_token_expires_at"),
	scope: text(),
	password: text(),
	createdAt: integer("created_at").default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	index("account_userId_idx").on(table.userId),
]);

export const invitation = sqliteTable("invitation", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" } ),
	email: text().notNull(),
	role: text(),
	status: text().default("pending").notNull(),
	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at").default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
	inviterId: text("inviter_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
},
(table) => [
	index("invitation_email_idx").on(table.email),
	index("invitation_organizationId_idx").on(table.organizationId),
]);

export const member = sqliteTable("member", {
	id: text().primaryKey().notNull(),
	organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
	role: text().default("staff").notNull(),
	createdAt: integer("created_at").notNull(),
},
(table) => [
	index("member_userId_idx").on(table.userId),
	index("member_organizationId_idx").on(table.organizationId),
]);

export const organization = sqliteTable("organization", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	logo: text(),
	createdAt: integer("created_at").notNull(),
	metadata: text(),
},
(table) => [
	uniqueIndex("organization_slug_uidx").on(table.slug),
	uniqueIndex("organization_slug_unique").on(table.slug),
]);

export const session = sqliteTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: integer("expires_at").notNull(),
	token: text().notNull(),
	createdAt: integer("created_at").default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
	updatedAt: integer("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
	activeOrganizationId: text("active_organization_id"),
},
(table) => [
	index("session_userId_idx").on(table.userId),
	uniqueIndex("session_token_unique").on(table.token),
]);

export const user = sqliteTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: integer("email_verified").default(0).notNull(),
	image: text(),
	createdAt: integer("created_at").default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
	updatedAt: integer("updated_at").default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
},
(table) => [
	uniqueIndex("user_email_unique").on(table.email),
]);

export const verification = sqliteTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at").default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
	updatedAt: integer("updated_at").default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
},
(table) => [
	index("verification_identifier_idx").on(table.identifier),
]);

export const rolePermission = sqliteTable("RolePermission", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	role: text().notNull(),
	resource: text().notNull(),
	action: text().notNull(),
	enabled: integer().default(1).notNull(),
	createdAt: text().default("DATETIME('NOW')"),
	updatedAt: text(),
	updatedBy: text(),
});

export const note = sqliteTable("Note", {
	id: integer().primaryKey().notNull(),
	accountId: integer().references(() => clientAccount.id),
	businessId: integer().references(() => business.id),
	content: text(),
	createdBy: text().notNull(),
	createdAt: text().notNull(),
	updatedBy: text(),
	updatedAt: text(),
});

export const task = sqliteTable("Task", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	accountId: integer().references(() => clientAccount.id),
	businessId: integer().references(() => business.id),
	content: text().notNull(),
	status: text().default("todo").notNull(),
	assignedTo: text(),
	createdAt: text().default("DATETIME('NOW')").notNull(),
	createdBy: text().notNull(),
	updatedAt: text(),
	updatedBy: text(),
});

export const service = sqliteTable("Service", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull(),
	isActive: integer().default(1).notNull(),
	createdAt: text().default("DATETIME('NOW')").notNull(),
	createdBy: text().notNull(),
	updatedAt: text(),
	updatedBy: text(),
});

export const clientAccountContact = sqliteTable("ClientAccountContact", {
	id: integer().primaryKey({ autoIncrement: true }),
	accountId: integer().references(() => clientAccount.id),
	contactType: text().notNull(),
	contactValue: text().notNull(),
	createdAt: text().default("(DATETIME('NOW'))"),
	createdBy: text().notNull(),
	updatedAt: text(),
	updatedBy: text(),
});

export const clientService = sqliteTable("ClientService", {
	id: integer().primaryKey({ autoIncrement: true }),
	accountId: integer().notNull().references(() => clientAccount.id, { onDelete: "cascade" }),
	serviceId: integer().notNull().references(() => service.id, { onDelete: "cascade" }),
	createdAt: text().default("(DATETIME('NOW'))"),
	createdBy: text().notNull(),
}, (table) => [
	uniqueIndex("client_service_unique").on(table.accountId, table.serviceId),
]);

export const clientLogin = sqliteTable("ClientLogin", {
	id: integer().primaryKey({ autoIncrement: true }),
	accountId: integer().notNull().references(() => clientAccount.id, { onDelete: "cascade" }),
	label: text().notNull(),
	username: text().notNull(),
	encryptedPassword: text().notNull(),
	url: text(),
	notes: text(),
	createdAt: text().default("(DATETIME('NOW'))"),
	createdBy: text().notNull(),
	updatedAt: text(),
	updatedBy: text(),
});

export const businessAccount = sqliteTable("BusinessAccount", {
	id: integer().primaryKey({ autoIncrement: true }),
	businessId: integer().notNull().references(() => business.id, { onDelete: "cascade" }),
	accountId: integer().notNull().references(() => clientAccount.id, { onDelete: "cascade" }),
	createdAt: text().default("(DATETIME('NOW'))"),
	createdBy: text().notNull(),
}, (table) => [
	uniqueIndex("business_account_unique").on(table.businessId, table.accountId),
]);

