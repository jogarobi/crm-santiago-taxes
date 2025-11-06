'use client';

import { useAccounts, useCreateAccount, useUpdateAccount, useDeleteAccount } from '@/lib/hooks/use-accounts';

/**
 * Example component demonstrating how to use the Account hooks
 * This is a reference implementation - adapt it to your needs
 */
export function AccountsExample() {
  // Fetch all accounts
  const { data: accounts, isLoading, error } = useAccounts();

  // Create account mutation
  const createAccount = useCreateAccount();

  // Update account mutation
  const updateAccount = useUpdateAccount();

  // Delete account mutation
  const deleteAccount = useDeleteAccount();

  // Example: Create a new account
  const handleCreateAccount = () => {
    createAccount.mutate({
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      ssnLastFour: '1234',
      address: '123 Main St',
      city: 'Miami',
      state: 'FL',
      zipCode: '33101',
      createdBy: 'user@example.com',
    });
  };

  // Example: Update an account
  const handleUpdateAccount = (id: number) => {
    updateAccount.mutate({
      id,
      data: {
        firstName: 'Jane',
        lastName: 'Doe',
        updatedBy: 'user@example.com',
      },
    });
  };

  // Example: Delete an account
  const handleDeleteAccount = (id: number) => {
    deleteAccount.mutate(id);
  };

  if (isLoading) return <div>Loading accounts...</div>;
  if (error) return <div>Error loading accounts: {error.message}</div>;

  return (
    <div>
      <h2>Accounts ({accounts?.length || 0})</h2>

      <button onClick={handleCreateAccount}>
        Create Account
      </button>

      <ul>
        {accounts?.map((account) => (
          <li key={account.id}>
            {account.firstName} {account.lastName}
            <button onClick={() => handleUpdateAccount(account.id)}>
              Update
            </button>
            <button onClick={() => handleDeleteAccount(account.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
