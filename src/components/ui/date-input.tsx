'use client';

import { useEffect, useState } from 'react';
import { format, isValid, parse } from 'date-fns';
import { ChevronDownIcon } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface DateInputProps {
  id?: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  startMonth?: Date;
  disabled?: React.ComponentProps<typeof Calendar>['disabled'];
}

// Insert slashes as the user types so they can write mm/dd/yyyy naturally.
function formatTyped(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  if (digits.length > 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export function DateInput({
  id,
  value,
  onChange,
  placeholder = 'mm/dd/yyyy',
  startMonth,
  disabled,
}: DateInputProps) {
  const [text, setText] = useState(value ? format(value, 'MM/dd/yyyy') : '');
  const [open, setOpen] = useState(false);

  // Keep the text in sync when the value changes externally
  // (calendar selection, form prefill, or reset).
  useEffect(() => {
    setText(value ? format(value, 'MM/dd/yyyy') : '');
  }, [value]);

  const handleTextChange = (raw: string) => {
    const formatted = formatTyped(raw);
    setText(formatted);

    if (formatted === '') {
      onChange(undefined);
      return;
    }

    if (formatted.length === 10) {
      const parsed = parse(formatted, 'MM/dd/yyyy', new Date());
      if (isValid(parsed)) {
        onChange(parsed);
      }
    }
  };

  return (
    <div className='relative'>
      <Input
        id={id}
        value={text}
        placeholder={placeholder}
        inputMode='numeric'
        className='p-2 pr-10'
        onChange={(e) => handleTextChange(e.target.value)}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            className='absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0'
            aria-label='Open calendar'
          >
            <ChevronDownIcon className='h-4 w-4' />
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto overflow-hidden p-0' align='end'>
          <Calendar
            mode='single'
            selected={value}
            captionLayout='dropdown'
            startMonth={startMonth}
            disabled={disabled}
            onSelect={(date) => {
              onChange(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
