'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { SignOutButton, UserAvatar, useUser } from '@clerk/nextjs';

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

export default function Sidebar() {
  const pathname = usePathname();
  const session = useUser();

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
            <DropdownMenu>
              <DropdownMenuTrigger className='h-full' asChild>
                <SidebarMenuButton className='px-3'>
                  <div className='flex items-center gap-3'>
                    <UserAvatar />
                    <div>
                      <p className='w-max text-sm font-semibold text-zinc-800'>
                        {session.user?.firstName}
                      </p>
                      <p className='text-muted-foreground text-sm'>Admin</p>
                    </div>
                  </div>
                  <ChevronUp className='ml-auto h-4 w-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side='top'
                className='w-[--radix-popper-anchor-width]'
              >
                <SignOutButton>
                  <DropdownMenuItem className='cursor-pointer text-destructive'>
                    <LogOut className='mr-2 h-4 w-4 stroke-destructive' />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </SignOutButton>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </CNSidebar>
  );
}
