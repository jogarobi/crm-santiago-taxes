import { Badge } from '@/components/ui/badge';
import { TrendingDownIcon, TrendingUpIcon } from 'lucide-react';

export default function Home() {
  return (
    <div className='flex flex-col gap-10'>
      <div className='flex items-center gap-7'>
        <div className='w-full border p-4 rounded-md flex flex-col gap-2 bg-white'>
          <div className='flex items-center justify-between'>
            <p className='text-[15px] text-neutral-600'>Total clients</p>
            <Badge variant='outline' asChild>
              <div>
                <TrendingUpIcon strokeWidth={2.5} />
                <span>+13.6%</span>
              </div>
            </Badge>
          </div>
          <p className='font-bold text-2xl text-purple'>3,205</p>
        </div>
        <div className='w-full border p-4 rounded-md flex flex-col gap-2 bg-white'>
          <div className='flex items-center justify-between'>
            <p className='text-[15px] text-neutral-600'>Revenue</p>
            <Badge variant='outline' asChild>
              <div>
                <TrendingUpIcon strokeWidth={2.5} />
                <span>+30.6%</span>
              </div>
            </Badge>
          </div>
          <p className='font-bold text-2xl text-purple'>$14,450.25</p>
        </div>
        <div className='w-full border p-4 rounded-md flex flex-col gap-2 bg-white'>
          <div className='flex items-center justify-between'>
            <p className='text-[15px] text-neutral-600'>Appointments</p>
            <Badge variant='outline' asChild>
              <div>
                <TrendingDownIcon strokeWidth={2.5} />
                <span>-11.6%</span>
              </div>
            </Badge>
          </div>
          <p className='font-bold text-2xl text-purple'>27</p>
        </div>

        <div className='w-full border p-4 rounded-md flex flex-col gap-2 bg-white'>
          <div className='flex items-center justify-between'>
            <p className='text-[15px] text-neutral-600'>Most popular service</p>
          </div>
          <p className='font-bold text-[22px] text-purple'>Tax Preparation</p>
        </div>
      </div>

      <div className='flex gap-14'>
        <div className='w-full'>
          <div className='flex items-center justify-between'>
            <h3 className='font-semibold text-[17px]'>Upcoming appointments</h3>
            <span className='text-neutral-600 text-[15px]'>27</span>
          </div>
        </div>

        <div className='w-full'>
          <div className='flex items-center justify-between'>
            <h3 className='font-semibold text-[17px]'>Pending tasks</h3>
            <span className='text-neutral-600 text-[15px]'>4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
