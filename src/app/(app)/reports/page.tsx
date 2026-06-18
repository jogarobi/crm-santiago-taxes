'use client';

import { useState } from 'react';
import { useStats, type StatsPeriod } from '@/hooks/use-stats';
import { useAccounts } from '@/hooks/use-accounts';
import {
  Loader2,
  Users,
  Building2,
  CheckCircle2,
  Calendar,
  DownloadIcon,
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const COLORS = ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

// Date the practice began tracking new clients in the CRM.
const NEW_CLIENTS_START = new Date(2026, 5, 18); // Thursday, June 18, 2026

function formatPhone(phone: string | null | undefined) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10)
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  if (cleaned.length === 11 && cleaned[0] === '1')
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  return phone;
}


export default function ReportsPage() {
  const [period, setPeriod] = useState<StatsPeriod>('all');
  const { data: stats, isLoading } = useStats({ period });

  type NewClientsPreset =
    | 'since_launch'
    | 'today'
    | 'this_week'
    | 'this_month'
    | 'custom';
  const [newClientsPreset, setNewClientsPreset] = useState<NewClientsPreset>('since_launch');
  const [newClientsCustomFrom, setNewClientsCustomFrom] = useState('');
  const [newClientsCustomTo, setNewClientsCustomTo] = useState('');

  function getNewClientsDateRange(): { dateFrom?: string; dateTo?: string } {
    const now = new Date();
    // Clients existed before the launch date (bulk import) are not "new", so the
    // window never starts earlier than NEW_CLIENTS_START.
    const floorToLaunch = (d: Date) =>
      d < NEW_CLIENTS_START ? NEW_CLIENTS_START : d;
    if (newClientsPreset === 'since_launch') {
      // All clients registered on/after the launch date, up to now.
      return { dateFrom: NEW_CLIENTS_START.toISOString() };
    }
    if (newClientsPreset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { dateFrom: floorToLaunch(start).toISOString(), dateTo: end.toISOString() };
    }
    if (newClientsPreset === 'this_week') {
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);
      return { dateFrom: floorToLaunch(monday).toISOString(), dateTo: sunday.toISOString() };
    }
    if (newClientsPreset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { dateFrom: floorToLaunch(start).toISOString(), dateTo: end.toISOString() };
    }
    return {
      dateFrom: newClientsCustomFrom ? new Date(newClientsCustomFrom).toISOString() : undefined,
      dateTo: newClientsCustomTo ? new Date(newClientsCustomTo + 'T23:59:59.999').toISOString() : undefined,
    };
  }

  const newClientsDateRange = getNewClientsDateRange();

  const { data: newClientsResponse, isLoading: newClientsLoading } = useAccounts({
    ...newClientsDateRange,
    pageSize: 500,
    pageIndex: 0,
  });

  const newClients = newClientsResponse?.data ?? [];
  const newClientsTotal = newClientsResponse?.meta?.total ?? 0;

  const presetLabels: Record<NewClientsPreset, string> = {
    since_launch: 'Since Jun 18, 2026',
    today: 'Today',
    this_week: 'This Week',
    this_month: 'This Month',
    custom: 'Custom',
  };

  function downloadBusinessesCSV() {
    const headers = ['Business Name', 'Established Date', 'Years in Business'];
    const rows = stats?.businessesDueList.map((b) => {
      const established = b.establishedDate ? new Date(b.establishedDate) : null;
      const years = established ? new Date().getFullYear() - established.getFullYear() : '';
      return [
        b.registeredName,
        established ? format(established, 'MM/dd/yyyy') : '',
        years,
      ];
    }) ?? [];
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `businesses-due-${format(new Date(), 'MMMM-yyyy').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadNewClientsCSV() {
    const headers = ['ID', 'First Name', 'Last Name', 'Date of Birth', 'SSN (Last 4)', 'Phone', 'Created By', 'Created On'];
    const rows = newClients.map((c) => [
      c.id,
      c.firstName,
      c.lastName,
      c.dateOfBirth || '',
      c.ssnLastFour || '',
      formatPhone(c.phoneNumber) || '',
      c.createdBy,
      c.createdAt ? format(new Date(c.createdAt), 'MM/dd/yyyy') : '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `new-clients-${newClientsPreset}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='w-8 h-8 animate-spin text-purple' />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <p className='text-neutral-500'>Failed to load statistics</p>
      </div>
    );
  }

  // Prepare data for services chart
  const servicesData = stats.servicesByAppointments.map((item) => ({
    name: item.service || 'Unknown',
    appointments: Number(item.count),
  }));

  // Prepare data for touchpoints chart
  const touchpointsData = stats.touchpointsByType.map((item) => ({
    name: item.typeName || 'Unknown',
    count: Number(item.count),
    icon: item.typeIcon,
  }));

  const chartConfig = {
    appointments: {
      label: 'Appointments',
      color: '#7c3aed',
    },
  };

  const touchpointChartConfig = {
    count: {
      label: 'Touchpoints',
      color: '#7c3aed',
    },
  };

  return (
    <div className='flex flex-col gap-8'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Reports & Analytics</h1>
        <Select
          value={period}
          onValueChange={(value: StatsPeriod) => setPeriod(value)}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Select period' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='day'>Today</SelectItem>
            <SelectItem value='month'>This Month</SelectItem>
            <SelectItem value='year'>This Year</SelectItem>
            <SelectItem value='all'>All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card className='bg-white shadow-none'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Clients</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple'>
              {stats.totalClients.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Active clients in the system
            </p>
          </CardContent>
        </Card>

        <Card className='bg-white shadow-none'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Businesses
            </CardTitle>
            <Building2 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple'>
              {stats.totalBusinesses.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Registered businesses
            </p>
          </CardContent>
        </Card>

        <Card className='bg-white shadow-none'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Completed Tasks
            </CardTitle>
            <CheckCircle2 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple'>
              {stats.completedTasks.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card className='bg-white shadow-none'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Due for Annual Report
            </CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple'>
              {stats.businessesDueThisMonth.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Businesses this month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      {/* New Clients Report */}
      <Card className='bg-white shadow-none'>
        <CardHeader>
          <div className='flex items-center justify-between gap-4'>
            <CardTitle>New Clients</CardTitle>
            <div className='flex items-center gap-2 flex-wrap'>
              {(['since_launch', 'today', 'this_week', 'this_month', 'custom'] as NewClientsPreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setNewClientsPreset(p);
                    if (p !== 'custom') {
                      setNewClientsCustomFrom('');
                      setNewClientsCustomTo('');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    newClientsPreset === p
                      ? 'bg-purple text-white border-purple'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:text-neutral-900'
                  }`}
                >
                  {presetLabels[p]}
                </button>
              ))}
              {newClientsPreset === 'custom' && (
                <>
                  <input
                    type='date'
                    value={newClientsCustomFrom}
                    onChange={(e) => setNewClientsCustomFrom(e.target.value)}
                    className='text-sm border border-neutral-200 rounded-md px-2 py-1.5 text-neutral-700 focus:outline-none focus:ring-1 focus:ring-purple'
                  />
                  <span className='text-neutral-400 text-sm'>to</span>
                  <input
                    type='date'
                    value={newClientsCustomTo}
                    min={newClientsCustomFrom}
                    onChange={(e) => setNewClientsCustomTo(e.target.value)}
                    className='text-sm border border-neutral-200 rounded-md px-2 py-1.5 text-neutral-700 focus:outline-none focus:ring-1 focus:ring-purple'
                  />
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            {newClientsLoading ? (
              <div className='flex items-center gap-3'>
                <Loader2 className='w-5 h-5 animate-spin text-purple' />
                <span className='text-neutral-500 text-sm'>Loading...</span>
              </div>
            ) : (
              <div className='flex items-baseline gap-2'>
                <span className='text-4xl font-bold text-purple'>{newClientsTotal.toLocaleString()}</span>
                <span className='text-neutral-500 text-sm'>
                  client{newClientsTotal !== 1 ? 's' : ''} registered in this period
                </span>
              </div>
            )}
            <Button
              variant='outline'
              size='sm'
              onClick={downloadNewClientsCSV}
              disabled={newClientsLoading || newClientsTotal === 0}
              className='flex items-center gap-2'
            >
              <DownloadIcon className='w-4 h-4' />
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Businesses Due for Tax Filing This Month */}
      <Card className='bg-white shadow-none'>
        <CardHeader>
          <CardTitle>Businesses Due for Tax Filing</CardTitle>
          <CardDescription>
            Annual report deadlines in {format(new Date(), 'MMMM yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div className='flex items-baseline gap-2'>
              <span className='text-4xl font-bold text-purple'>
                {(stats?.businessesDueList.length ?? 0).toLocaleString()}
              </span>
              <span className='text-neutral-500 text-sm'>
                {(stats?.businessesDueList.length ?? 0) !== 1 ? 'businesses' : 'business'} due this month
              </span>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={downloadBusinessesCSV}
              disabled={!stats || stats.businessesDueList.length === 0}
              className='flex items-center gap-2'
            >
              <DownloadIcon className='w-4 h-4' />
              Download CSV
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card className='bg-white shadow-none'>
          <CardHeader>
            <CardTitle>Services by Appointments</CardTitle>
            <CardDescription>
              Top services ranked by number of appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {servicesData.length > 0 ? (
              <ChartContainer config={chartConfig} className='h-[300px]'>
                <BarChart data={servicesData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    dataKey='name'
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor='end'
                    height={100}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey='appointments'
                    fill='var(--color-appointments)'
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className='flex items-center justify-center h-[300px] text-neutral-500'>
                No appointment data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='bg-white shadow-none'>
          <CardHeader>
            <CardTitle>Services Distribution</CardTitle>
            <CardDescription>
              Percentage breakdown of appointments by service
            </CardDescription>
          </CardHeader>
          <CardContent>
            {servicesData.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className='h-[300px] flex items-center justify-center'
              >
                <PieChart>
                  <Pie
                    data={servicesData}
                    dataKey='appointments'
                    nameKey='name'
                    cx='50%'
                    cy='50%'
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {servicesData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className='flex items-center justify-center h-[300px] text-neutral-500'>
                No appointment data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Client Touchpoints Chart */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card className='bg-white shadow-none'>
          <CardHeader>
            <CardTitle>Client Touchpoints by Type</CardTitle>
            <CardDescription>
              Activity types ranked by occurrence
            </CardDescription>
          </CardHeader>
          <CardContent>
            {touchpointsData.length > 0 ? (
              <ChartContainer
                config={touchpointChartConfig}
                className='h-[300px]'
              >
                <BarChart data={touchpointsData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    dataKey='name'
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor='end'
                    height={80}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey='count'
                    fill='var(--color-count)'
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className='flex items-center justify-center h-[300px] text-neutral-500'>
                No touchpoint data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='bg-white shadow-none'>
          <CardHeader>
            <CardTitle>Touchpoints Distribution</CardTitle>
            <CardDescription>
              Percentage breakdown of client interactions by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {touchpointsData.length > 0 ? (
              <ChartContainer
                config={touchpointChartConfig}
                className='h-[300px] flex items-center justify-center'
              >
                <PieChart>
                  <Pie
                    data={touchpointsData}
                    dataKey='count'
                    nameKey='name'
                    cx='50%'
                    cy='50%'
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {touchpointsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className='flex items-center justify-center h-[300px] text-neutral-500'>
                No touchpoint data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
