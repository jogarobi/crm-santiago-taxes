import { SidebarProvider } from '@/components/ui/sidebar';
import { QueryProvider } from '@/providers/query-provider';

export default function AllProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <SidebarProvider>{children}</SidebarProvider>
    </QueryProvider>
  );
}
