'use client';

import { useState } from 'react';
import { useStats, type StatsPeriod } from '@/hooks/use-stats';
import {
  Loader2,
  Users,
  Building2,
  CheckCircle2,
  Calendar,
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
import { format } from 'date-fns';

const COLORS = ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

export default function ReportsPage() {
  const [period, setPeriod] = useState<StatsPeriod>('all');
  const { data: stats, isLoading } = useStats({ period });

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

      {/* Businesses Due for Tax Filing This Month */}
      {stats.businessesDueList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Businesses Due for Tax Filing This Month</CardTitle>
            <CardDescription>
              Businesses with tax filing deadlines in{' '}
              {format(new Date(), 'MMMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {stats.businessesDueList.map((business) => {
                const establishedDate = business.establishedDate
                  ? new Date(business.establishedDate)
                  : null;
                const years = establishedDate
                  ? new Date().getFullYear() - establishedDate.getFullYear()
                  : 0;

                return (
                  <div
                    key={business.id}
                    className='flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50 transition-colors'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='h-10 w-10 rounded-full bg-purple/10 flex items-center justify-center'>
                        <Building2 className='h-5 w-5 text-purple' />
                      </div>
                      <div>
                        <p className='font-semibold text-[15px]'>
                          {business.registeredName}
                        </p>
                        <p className='text-sm text-neutral-500'>
                          Established:{' '}
                          {establishedDate
                            ? format(establishedDate, 'MMMM d, yyyy')
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='font-semibold text-purple'>
                        {years} {years === 1 ? 'year' : 'years'}
                      </p>
                      <p className='text-xs text-neutral-500'>in business</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
