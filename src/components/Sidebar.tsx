'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sidebar as CNSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import {
  BriefcaseIcon,
  CalendarIcon,
  CheckCheckIcon,
  ChevronUp,
  DollarSignIcon,
  HomeIcon,
  Loader2,
  LogOut,
  SettingsIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';
import { authClient } from '@/app/api/clients';
import { useState } from 'react';

const items = [
  {
    title: 'Home',
    url: '/',
    icon: HomeIcon,
  },
  {
    title: 'Clients',
    url: '/clients',
    icon: UserIcon,
  },
  {
    title: 'Appointments',
    url: '/appointments',
    icon: CalendarIcon,
  },
  {
    title: 'Payments',
    url: '#',
    icon: DollarSignIcon,
  },
  {
    title: 'Tasks',
    url: '#',
    icon: CheckCheckIcon,
  },
];

const managementItems = [
  {
    title: 'Staff',
    url: '#',
    icon: BriefcaseIcon,
  },
  { title: 'Users', url: '#', icon: UsersIcon },
  {
    title: 'Settings',
    url: '#',
    icon: SettingsIcon,
  },
];

function getInitials(name: string): string {
  const names = name.trim().split(' ');
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/login');
        },
        onError: (ctx) => {
          console.error('Sign out error:', ctx.error);
          setIsSigningOut(false);
        },
      },
    });
  };

  return (
    <CNSidebar>
      <SidebarHeader className='flex flex-row items-center gap-2 px-3 py-4 bg-white'>
        <Image
          src='/santiago-taxes-logo.png'
          alt='Company Logo'
          width={38}
          height={38}
          priority
        />

        <div>
          <h2 className='text-[15px] text-purple font-semibold'>
            Santiago Taxes
          </h2>
          <p className='text-[13px] text-muted-foreground'>CRM</p>
        </div>
      </SidebarHeader>
      <SidebarContent className='pt-4 px-1 bg-white'>
        <SidebarGroup className='gap-2'>
          <SidebarGroupLabel className='text-[13px]'>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className='gap-2'>
              {items.map((item) => {
                const isActive =
                  item.url === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className='py-5 px-3 data-[active=true]:bg-neutral-100 data-[active=true]:text-purple'
                      isActive={isActive}
                      asChild
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span className='text-sm'>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className='gap-2'>
          <SidebarGroupLabel className='text-[13px]'>
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className='gap-2'>
              {managementItems.map((item) => {
                const isActive =
                  item.url === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className='py-5 px-3 data-[active=true]:bg-neutral-100 data-[active=true]:text-purple'
                      isActive={isActive}
                      asChild
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span className='text-sm'>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className='bg-white'>
        <SidebarMenu>
          <SidebarMenuItem>
            {isPending ? (
              <SidebarMenuButton className='px-3' disabled>
                <div className='flex items-center gap-3'>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  <span className='text-sm text-muted-foreground'>
                    Loading...
                  </span>
                </div>
              </SidebarMenuButton>
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger className='h-full' asChild>
                  <SidebarMenuButton className='px-3'>
                    <div className='flex items-center gap-3'>
                      <span className='inline-block p-2 rounded-full bg-purple text-white text-xs font-semibold'>
                        {getInitials(session.user.name)}
                      </span>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-semibold text-zinc-800 truncate'>
                          {session.user.name}
                        </p>
                        <p className='text-muted-foreground text-xs truncate'>
                          Admin
                        </p>
                      </div>
                    </div>
                    <ChevronUp className='ml-auto h-4 w-4 shrink-0' />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side='top'
                  className='w-[--radix-popper-anchor-width]'
                >
                  <DropdownMenuItem
                    className='cursor-pointer text-destructive'
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    {isSigningOut ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 stroke-destructive animate-spin' />
                        <span>Signing out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className='mr-2 h-4 w-4 stroke-destructive' />
                        <span>Sign out</span>
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </CNSidebar>
  );
}
