'use client';

import { useState } from 'react';
import { useAccounts } from '@/lib/hooks/use-accounts';

/**
 * Example component demonstrating search functionality for accounts
 * Searches across: firstName, lastName, ssnLastFour, and id
 */
export function AccountsSearchExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: accounts, isLoading, error } = useAccounts(searchTerm);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div>
      <h2>Search Accounts</h2>

      <input
        type="text"
        placeholder="Search by name, ID, or last 4 SSN..."
        value={searchTerm}
        onChange={handleSearch}
      />

      {isLoading && <div>Loading accounts...</div>}
      {error && <div>Error loading accounts: {error.message}</div>}

      <div>
        <p>Found {accounts?.length || 0} account(s)</p>
        <ul>
          {accounts?.map((account) => (
            <li key={account.id}>
              ID: {account.id} - {account.firstName} {account.lastName}
              {account.ssnLastFour && ` (***-**-${account.ssnLastFour})`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
