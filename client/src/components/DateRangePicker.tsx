import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export default function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = "Pick a date range",
  className,
  align = 'start'
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    onDateRangeChange(range);
    // Close popover if both dates are selected
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateRangeChange(undefined);
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return placeholder;
    
    if (!dateRange.to) {
      return format(dateRange.from, "MMM d, yyyy");
    }
    
    return `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`;
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
            data-testid="button-date-range"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="flex-1">{formatDateRange()}</span>
            {dateRange && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={handleClear}
                data-testid="button-clear-date"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
          <div className="flex items-center justify-between p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date();
                lastWeek.setDate(today.getDate() - 7);
                handleSelect({ from: lastWeek, to: today });
              }}
              data-testid="button-preset-last-week"
            >
              Last 7 days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date();
                lastMonth.setMonth(today.getMonth() - 1);
                handleSelect({ from: lastMonth, to: today });
              }}
              data-testid="button-preset-last-month"
            >
              Last 30 days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastYear = new Date();
                lastYear.setFullYear(today.getFullYear() - 1);
                handleSelect({ from: lastYear, to: today });
              }}
              data-testid="button-preset-last-year"
            >
              Last year
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelect(undefined)}
              data-testid="button-clear-all"
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}