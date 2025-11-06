import Image from 'next/image';
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
  CalendarIcon,
  ChevronUp,
  HomeIcon,
  LogOut,
  Settings,
  UserIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';

const items = [
  {
    title: 'Dashboard',
    url: '#',
    icon: HomeIcon,
  },
  {
    title: 'Clients',
    url: '#',
    icon: UserIcon,
  },
  {
    title: 'Appointments',
    url: '#',
    icon: CalendarIcon,
  },
];

export default function Sidebar() {
  return (
    <CNSidebar>
      <SidebarHeader className='flex flex-row items-center gap-2 px-3 py-4'>
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
      <SidebarContent className='pt-4 px-1'>
        <SidebarGroup className='gap-2'>
          <SidebarGroupLabel className='text-[13px]'>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className='gap-2'>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton className='py-5 px-3' asChild>
                    <a className='block' href={item.url}>
                      <item.icon />
                      <span className='text-sm'>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className='h-full' asChild>
                <SidebarMenuButton className='px-3'>
                  <div className='flex items-center gap-3'>
                    <span className='inline-block p-2 rounded-full bg-purple text-white'>
                      GS
                    </span>
                    <div>
                      <p className='w-max text-[15px] font-semibold text-zinc-800'>
                        Guelmie Santiago
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
                <DropdownMenuItem>
                  <Settings className='mr-2 h-4 w-4' />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className='mr-2 h-4 w-4' />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </CNSidebar>
  );
}
