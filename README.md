This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Santiago Taxes CRM

A comprehensive CRM system for tax preparation businesses built with Next.js, featuring client management, appointments, payments, tasks, and more.

## Features

- **Client Management** - Track customers and their information
- **Appointments** - Schedule and manage appointments with Square integration
- **Payments** - Process payments through Square
- **Tasks** - Kanban-style task board with 5 status columns
- **Business Entities** - Manage business clients
- **Notes** - Add notes to clients and businesses
- **Staff Management** - Manage team members
- **Database-Driven Permissions** - Customizable role-based access control

## Permission System

This application uses a comprehensive database-driven permission system. See [PERMISSIONS.md](./PERMISSIONS.md) for full documentation.

**Quick Setup:**
1. Navigate to `/settings`
2. Click "Initialize Defaults"
3. Customize permissions for each role as needed

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Turso database account ([turso.tech](https://turso.tech))
- Square developer account for payments/appointments

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# Square API (for payments and appointments)
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_ENVIRONMENT=sandbox # or production

# Better Auth
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000
```

### Installation

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:generate
npm run db:migrate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
