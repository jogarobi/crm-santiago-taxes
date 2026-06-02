import { relations } from "drizzle-orm/relations";
import { clientAccount, clientAccountRelation, businessEntity, business, activityType, activity, user, staff, appointment, account, invitation, organization, member, session, note, task, clientAccountContact, businessAccount } from "./schema";

export const clientAccountRelationRelations = relations(clientAccountRelation, ({one}) => ({
	clientAccount_relatedAccountId: one(clientAccount, {
		fields: [clientAccountRelation.relatedAccountId],
		references: [clientAccount.id],
		relationName: "clientAccountRelation_relatedAccountId_clientAccount_id"
	}),
	clientAccount_accountId: one(clientAccount, {
		fields: [clientAccountRelation.accountId],
		references: [clientAccount.id],
		relationName: "clientAccountRelation_accountId_clientAccount_id"
	}),
}));

export const clientAccountRelations = relations(clientAccount, ({many}) => ({
	clientAccountRelations_relatedAccountId: many(clientAccountRelation, {
		relationName: "clientAccountRelation_relatedAccountId_clientAccount_id"
	}),
	clientAccountRelations_accountId: many(clientAccountRelation, {
		relationName: "clientAccountRelation_accountId_clientAccount_id"
	}),
	businesses: many(business),
	businessAccounts: many(businessAccount),
	activities: many(activity),
	appointments: many(appointment),
	notes: many(note),
	tasks: many(task),
	clientAccountContacts: many(clientAccountContact),
}));

export const businessRelations = relations(business, ({one, many}) => ({
	businessEntity: one(businessEntity, {
		fields: [business.entityId],
		references: [businessEntity.id]
	}),
	clientAccount: one(clientAccount, {
		fields: [business.accountId],
		references: [clientAccount.id]
	}),
	businessAccounts: many(businessAccount),
	activities: many(activity),
	notes: many(note),
	tasks: many(task),
}));

export const businessEntityRelations = relations(businessEntity, ({many}) => ({
	businesses: many(business),
}));

export const activityRelations = relations(activity, ({one}) => ({
	activityType: one(activityType, {
		fields: [activity.typeId],
		references: [activityType.id]
	}),
	clientAccount: one(clientAccount, {
		fields: [activity.accountId],
		references: [clientAccount.id]
	}),
	business: one(business, {
		fields: [activity.businessId],
		references: [business.id]
	}),
}));

export const activityTypeRelations = relations(activityType, ({many}) => ({
	activities: many(activity),
}));

export const staffRelations = relations(staff, ({one, many}) => ({
	user: one(user, {
		fields: [staff.userId],
		references: [user.id]
	}),
	appointments: many(appointment),
}));

export const userRelations = relations(user, ({many}) => ({
	staff: many(staff),
	accounts: many(account),
	invitations: many(invitation),
	members: many(member),
	sessions: many(session),
}));

export const appointmentRelations = relations(appointment, ({one}) => ({
	staff: one(staff, {
		fields: [appointment.staffId],
		references: [staff.id]
	}),
	clientAccount: one(clientAccount, {
		fields: [appointment.accountId],
		references: [clientAccount.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const invitationRelations = relations(invitation, ({one}) => ({
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id]
	}),
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id]
	}),
}));

export const organizationRelations = relations(organization, ({many}) => ({
	invitations: many(invitation),
	members: many(member),
}));

export const memberRelations = relations(member, ({one}) => ({
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	}),
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const noteRelations = relations(note, ({one}) => ({
	business: one(business, {
		fields: [note.businessId],
		references: [business.id]
	}),
	clientAccount: one(clientAccount, {
		fields: [note.accountId],
		references: [clientAccount.id]
	}),
}));

export const taskRelations = relations(task, ({one}) => ({
	business: one(business, {
		fields: [task.businessId],
		references: [business.id]
	}),
	clientAccount: one(clientAccount, {
		fields: [task.accountId],
		references: [clientAccount.id]
	}),
}));

export const clientAccountContactRelations = relations(clientAccountContact, ({one}) => ({
	clientAccount: one(clientAccount, {
		fields: [clientAccountContact.accountId],
		references: [clientAccount.id]
	}),
}));

export const businessAccountRelations = relations(businessAccount, ({one}) => ({
	business: one(business, {
		fields: [businessAccount.businessId],
		references: [business.id]
	}),
	clientAccount: one(clientAccount, {
		fields: [businessAccount.accountId],
		references: [clientAccount.id]
	}),
}));