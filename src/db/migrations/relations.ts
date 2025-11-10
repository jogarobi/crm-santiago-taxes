import { relations } from "drizzle-orm/relations";
import { account, accountRelation, accountContact, businessEntity, business, activityType, activity, staff, appointment } from "./schema";

export const accountRelationRelations = relations(accountRelation, ({one}) => ({
	account_relatedAccountId: one(account, {
		fields: [accountRelation.relatedAccountId],
		references: [account.id],
		relationName: "accountRelation_relatedAccountId_account_id"
	}),
	account_accountId: one(account, {
		fields: [accountRelation.accountId],
		references: [account.id],
		relationName: "accountRelation_accountId_account_id"
	}),
}));

export const accountRelations = relations(account, ({many}) => ({
	accountRelations_relatedAccountId: many(accountRelation, {
		relationName: "accountRelation_relatedAccountId_account_id"
	}),
	accountRelations_accountId: many(accountRelation, {
		relationName: "accountRelation_accountId_account_id"
	}),
	accountContacts: many(accountContact),
	businesses: many(business),
	activities: many(activity),
	appointments: many(appointment),
}));

export const accountContactRelations = relations(accountContact, ({one}) => ({
	account: one(account, {
		fields: [accountContact.accountId],
		references: [account.id]
	}),
}));

export const businessRelations = relations(business, ({one}) => ({
	businessEntity: one(businessEntity, {
		fields: [business.entityId],
		references: [businessEntity.id]
	}),
	account: one(account, {
		fields: [business.accountId],
		references: [account.id]
	}),
}));

export const businessEntityRelations = relations(businessEntity, ({many}) => ({
	businesses: many(business),
}));

export const activityRelations = relations(activity, ({one}) => ({
	activityType: one(activityType, {
		fields: [activity.typeId],
		references: [activityType.id]
	}),
	account: one(account, {
		fields: [activity.accountId],
		references: [account.id]
	}),
}));

export const activityTypeRelations = relations(activityType, ({many}) => ({
	activities: many(activity),
}));

export const appointmentRelations = relations(appointment, ({one}) => ({
	staff: one(staff, {
		fields: [appointment.staffId],
		references: [staff.id]
	}),
	account: one(account, {
		fields: [appointment.accountId],
		references: [account.id]
	}),
}));

export const staffRelations = relations(staff, ({many}) => ({
	appointments: many(appointment),
}));