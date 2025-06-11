declare module 'react-date-range' {
  import { ComponentType } from 'react';

  export interface DateRange {
    startDate: Date;
    endDate: Date;
    key: string;
  }

  export interface DateRangePickerProps {
    ranges?: DateRange[];
    onChange?: (ranges: { [key: string]: DateRange }) => void;
    months?: number;
    direction?: 'horizontal' | 'vertical';
    minDate?: Date;
    maxDate?: Date;
    showDateDisplay?: boolean;
    showMonthAndYearPickers?: boolean;
    showSelectionPreview?: boolean;
    moveRangeOnFirstSelection?: boolean;
    monthsWithDisabledDays?: Date[];
    disabledDates?: Date[];
    disabledDay?: (date: Date) => boolean;
    dayDisplayFormat?: string;
    weekdayDisplayFormat?: string;
    monthDisplayFormat?: string;
    rangeColors?: string[];
    dragSelectionEnabled?: boolean;
    fixedHeight?: boolean;
    calendarFocus?: 'forwards' | 'backwards';
    initialFocusedRange?: number;
    focusedRange?: [number, number];
    onRangeFocusChange?: (focusedRange: [number, number]) => void;
    onShownDateChange?: (date: Date) => void;
    onPreviewChange?: (date: Date) => void;
    preview?: {
      startDate?: Date;
      endDate?: Date;
    };
    showPreview?: boolean;
    retainEndDateOnFirstSelection?: boolean;
    staticRanges?: any[];
    inputRanges?: any[];
    className?: string;
    classNames?: {
      [key: string]: string;
    };
    styles?: {
      [key: string]: React.CSSProperties;
    };
  }

  export const DateRangePicker: ComponentType<DateRangePickerProps>;
} 