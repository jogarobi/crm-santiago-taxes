import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import { nextCookies } from 'better-auth/next-js';
import { organization } from 'better-auth/plugins';
import { ac, roles } from './permissions';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    nextCookies(),
    organization({
      ac,
      roles,
      defaultRole: 'staff',
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invitation/${data.id}`;

        // TODO: Configure email service (Resend, SendGrid, etc.)
        // For now, log the invitation details
        console.log('Organization Invitation:', {
          email: data.email,
          invitedBy: `${data.inviter.user.name} (${data.inviter.user.email})`,
          organization: data.organization.name,
          role: data.role,
          inviteLink,
        });

        // Placeholder - Replace with actual email service
        // Example with Resend:
        // await resend.emails.send({
        //   from: 'Santiago Taxes <onboarding@santiagotaxes.com>',
        //   to: data.email,
        //   subject: `You're invited to join ${data.organization.name}`,
        //   html: `
        //     <p>${data.inviter.user.name} invited you to join ${data.organization.name}</p>
        //     <a href="${inviteLink}">Accept Invitation</a>
        //   `,
        // });
      },
      async onInvitationAccepted(data) {
        // Link the user to their staff profile if one exists
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/staff/link-user`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: data.acceptedUser.email,
                userId: data.acceptedUser.id,
              }),
            }
          );
          console.log(
            `Linked user ${data.acceptedUser.email} to staff profile`
          );
        } catch (error) {
          console.error('Failed to link user to staff profile:', error);
        }
      },
    }),
  ],
});
