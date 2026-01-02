import { SidebarProvider } from '@/components/ui/sidebar';
import { QueryProvider } from '@/providers/query-provider';
import { ClerkProvider } from '@clerk/nextjs';

export default function AllProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <QueryProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </QueryProvider>
    </ClerkProvider>
  );
}
