import { relations } from 'drizzle-orm/relations';
import {
  clientAccount,
  clientAccountRelation,
  clientAccountContact,
  businessEntity,
  business,
  activityType,
  activity,
  staff,
  appointment,
  note,
  user,
  account,
  session,
} from './schema';

export const clientAccountRelationRelations = relations(
  clientAccountRelation,
  ({ one }) => ({
    clientAccount_relatedAccountId: one(clientAccount, {
      fields: [clientAccountRelation.relatedAccountId],
      references: [clientAccount.id],
      relationName: 'clientAccountRelation_relatedAccountId_clientAccount_id',
    }),
    clientAccount_accountId: one(clientAccount, {
      fields: [clientAccountRelation.accountId],
      references: [clientAccount.id],
      relationName: 'clientAccountRelation_accountId_clientAccount_id',
    }),
  })
);

export const clientAccountRelations = relations(clientAccount, ({ many }) => ({
  clientAccountRelations_relatedAccountId: many(clientAccountRelation, {
    relationName: 'clientAccountRelation_relatedAccountId_clientAccount_id',
  }),
  clientAccountRelations_accountId: many(clientAccountRelation, {
    relationName: 'clientAccountRelation_accountId_clientAccount_id',
  }),
  clientAccountContacts: many(clientAccountContact),
  businesses: many(business),
  activities: many(activity),
  appointments: many(appointment),
  notes: many(note),
}));

export const clientAccountContactRelations = relations(
  clientAccountContact,
  ({ one }) => ({
    clientAccount: one(clientAccount, {
      fields: [clientAccountContact.accountId],
      references: [clientAccount.id],
    }),
  })
);

export const businessRelations = relations(business, ({ one }) => ({
  businessEntity: one(businessEntity, {
    fields: [business.entityId],
    references: [businessEntity.id],
  }),
  clientAccount: one(clientAccount, {
    fields: [business.accountId],
    references: [clientAccount.id],
  }),
}));

export const businessEntityRelations = relations(
  businessEntity,
  ({ many }) => ({
    businesses: many(business),
  })
);

export const activityRelations = relations(activity, ({ one }) => ({
  activityType: one(activityType, {
    fields: [activity.typeId],
    references: [activityType.id],
  }),
  clientAccount: one(clientAccount, {
    fields: [activity.accountId],
    references: [clientAccount.id],
  }),
}));

export const activityTypeRelations = relations(activityType, ({ many }) => ({
  activities: many(activity),
}));

export const appointmentRelations = relations(appointment, ({ one }) => ({
  staff: one(staff, {
    fields: [appointment.staffId],
    references: [staff.id],
  }),
  clientAccount: one(clientAccount, {
    fields: [appointment.accountId],
    references: [clientAccount.id],
  }),
}));

export const staffRelations = relations(staff, ({ many }) => ({
  appointments: many(appointment),
}));

export const noteRelations = relations(note, ({ one }) => ({
  clientAccount: one(clientAccount, {
    fields: [note.accountId],
    references: [clientAccount.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  accounts: many(account),
  sessions: many(session),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));
