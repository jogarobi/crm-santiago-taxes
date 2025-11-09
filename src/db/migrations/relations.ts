import { relations } from "drizzle-orm/relations";
import { account, accountRelation, accountContact, businessEntity, business } from "./schema";

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