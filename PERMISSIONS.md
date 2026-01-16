# Permission Management System

This application uses a comprehensive database-driven permission system that is independent of Better Auth's permission system.

## Quick Start

1. **Navigate to Settings**: Go to `/settings` in your browser or click "Settings" in the sidebar
2. **Initialize Permissions**: Click the "Initialize Defaults" button (first time only)
3. **Customize Permissions**:
   - Select a role (Owner, Admin, or Staff)
   - Toggle permissions on/off using the switches
   - Click "Save Permissions" when done

That's it! Your custom permissions are now active and stored in the database.

## Overview

Permissions are managed entirely through the database with a fallback to sensible defaults. This provides maximum flexibility while maintaining security.

## Architecture

### Components

1. **Database Table**: `RolePermission` stores custom permission overrides
2. **Default Permissions**: Hardcoded defaults for each role
3. **Permission Utilities**: Helper functions in `/src/lib/auth-utils.ts`
4. **API Endpoints**: `/api/permissions` for managing permissions

### Roles

Three roles are supported:
- `owner` - Full access to all resources
- `admin` - Most permissions except staff management
- `staff` - Limited permissions for day-to-day work

### Resources

Available resources:
- `client` - Client/customer management
- `appointment` - Appointment scheduling
- `payment` - Payment processing
- `report` - Reports and analytics
- `staff` - Staff member management
- `task` - Task management
- `business` - Business entity management
- `note` - Notes and comments

### Actions

Available actions:
- `create` - Create new records
- `read` - View/list records
- `update` - Modify existing records
- `delete` - Remove records
- `cancel` - Cancel appointments
- `refund` - Process refunds
- `export` - Export data

## Usage in API Routes

### Basic Usage

```typescript
import { requirePermission } from '@/lib/auth-utils';

export async function GET(request: Request) {
  // Require read permission for tasks
  await requirePermission({ task: ['read'] });

  // ... rest of your code
}

export async function POST(request: Request) {
  // Require create permission for tasks
  await requirePermission({ task: ['create'] });

  // ... rest of your code
}
```

### Multiple Permissions

```typescript
// Require multiple permissions
await requirePermission({
  task: ['read', 'update'],
  client: ['read']
});
```

### Checking Without Redirect

```typescript
import { hasPermission } from '@/lib/auth-utils';

// Returns boolean, doesn't redirect
const canDelete = await hasPermission({ task: ['delete'] });

if (canDelete) {
  // Allow deletion
} else {
  // Show error or hide UI
}
```

## Default Permissions

### Owner
Full access to all resources and actions.

### Admin
- **Clients**: Full CRUD
- **Appointments**: Full CRUD + cancel
- **Payments**: Create, read (no refund)
- **Reports**: Read, export
- **Staff**: Read only
- **Tasks**: Full CRUD
- **Business**: Full CRUD
- **Notes**: Full CRUD

### Staff
- **Clients**: Read only
- **Appointments**: Create, read, update
- **Payments**: Read only
- **Reports**: Read only
- **Staff**: Read only
- **Tasks**: Create, read, update
- **Business**: Read only
- **Notes**: Create, read, update

## Managing Permissions

### Using the Settings UI (Recommended)

The easiest way to manage permissions is through the Settings page at `/settings`.

**How to Use:**

1. **Access Settings**: Navigate to `/settings` or click "Settings" in the sidebar
2. **Select Role**: Choose Owner, Admin, or Staff at the top of the page
3. **Toggle Permissions**: Use the switches to enable/disable permissions for each resource
4. **Save**: Click "Save Permissions" to persist changes to the database
5. **Initialize Defaults**: Click "Initialize Defaults" button to populate database with default permissions (first time only)

**UI Features:**

- **Role Selector**: Large, clear buttons for each role with visual indicators
- **Permission Grid**: Organized cards for each resource (Clients, Appointments, Tasks, etc.)
- **Toggle Switches**: Easy on/off controls for each action
- **Color Coding**:
  - Owner: Purple badge
  - Admin: Blue badge
  - Staff: Gray badge
- **Resource Descriptions**: Helpful text explaining what each resource manages
- **Real-time Updates**: Changes are reflected immediately as you toggle
- **Save Confirmation**: Toast notifications confirm when permissions are saved
- **Loading States**: Visual feedback while loading or saving

**Settings Page Location:**
```
/src/app/(app)/settings/page.tsx
```

### API Methods (Advanced)

#### Initialize Default Permissions

```bash
# Call this once to populate database with defaults
PUT /api/permissions/initialize
```

Or use the "Initialize Defaults" button in the Settings UI.

#### Get Role Permissions

```bash
GET /api/permissions?role=staff
```

Response:
```json
{
  "success": true,
  "role": "staff",
  "permissions": {
    "client": ["read"],
    "task": ["create", "read", "update"],
    ...
  }
}
```

#### Update a Permission

```bash
POST /api/permissions
Content-Type: application/json

{
  "role": "staff",
  "resource": "client",
  "action": "create",
  "enabled": true
}
```

This will:
- Give staff the ability to create clients
- Override the default permission
- Store in database for persistence

#### Disable a Permission

```bash
POST /api/permissions
Content-Type: application/json

{
  "role": "admin",
  "resource": "payment",
  "action": "refund",
  "enabled": false
}
```

## Permission Resolution

The system resolves permissions in this order:

1. **Check Database** - If a permission record exists in the database, use its `enabled` value
2. **Use Default** - If no database record exists, fall back to the default permissions for that role

This means:
- Database overrides always take precedence
- You only need to store exceptions in the database
- Defaults provide sensible out-of-the-box permissions

## Examples

### Example 1: Protect an API Route

```typescript
// /app/api/clients/route.ts
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { clientAccount } from '@/db/migrations/schema';

export async function GET(request: Request) {
  // Only users with 'client' read permission can access
  await requirePermission({ client: ['read'] });

  const clients = await db.select().from(clientAccount);
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  // Only users with 'client' create permission can create
  await requirePermission({ client: ['create'] });

  const body = await request.json();
  // ... create client
}
```

### Example 2: Conditional UI Rendering

```typescript
// In a React component
import { hasPermission } from '@/lib/auth-utils';

export async function ClientList() {
  const canCreate = await hasPermission({ client: ['create'] });
  const canDelete = await hasPermission({ client: ['delete'] });

  return (
    <div>
      {canCreate && <Button>Create Client</Button>}
      {/* ... client list ... */}
      {canDelete && <Button>Delete</Button>}
    </div>
  );
}
```

### Example 3: Grant Staff Create Permission (UI Method)

If you want to allow staff to create clients (normally they can only read):

1. Go to Settings (`/settings`)
2. Select "Staff" role
3. Find the "Clients" card
4. Toggle the "Create" switch to ON
5. Click "Save Permissions"

Now all staff members can create clients!

**Alternative (API Method):**

```typescript
// Call your API
await fetch('/api/permissions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    role: 'staff',
    resource: 'client',
    action: 'create',
    enabled: true
  })
});
```

## Migration from Better Auth Permissions

The old system used Better Auth's permission system. The new system:

1. **Still uses Better Auth for authentication** (login, session, user management)
2. **Uses Better Auth for organization roles** (to get whether user is owner/admin/staff)
3. **Does NOT use Better Auth for resource permissions** (all managed in database)

This gives you:
- Full control over permissions
- Easy permission management UI at `/settings`
- Ability to grant/revoke permissions at runtime
- Independence from third-party permission systems

**Migration Steps:**

1. Visit `/settings` in your application
2. Click "Initialize Defaults" to populate the database with default permissions
3. Customize permissions for each role as needed
4. All API routes will now use database permissions instead of Better Auth permissions

## Best Practices

1. **Initialize on Setup** - Use the "Initialize Defaults" button in Settings when first setting up the app
2. **Use the Settings UI** - Prefer the visual UI over API calls for managing permissions
3. **Use Defaults** - Only override when necessary for your specific business needs
4. **Document Changes** - Keep track of permission customizations in your team's documentation
5. **Test Thoroughly** - Always test permission changes in development before production
6. **Audit Regularly** - Review permissions periodically through the Settings page
7. **Role-Based Strategy** - Customize permissions by role, not individual users

## Security Notes

- All permission checks happen server-side in API routes
- Client-side checks are for UX only (hiding/showing buttons)
- Never trust client-side permission checks for security
- Always validate permissions in your API endpoints
- Permissions are checked on every API request
