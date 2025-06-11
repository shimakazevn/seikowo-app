declare module 'react-virtualized' {
  import { ComponentType, ReactNode } from 'react';

  export interface ListProps {
    width: number;
    height: number;
    rowCount: number;
    rowHeight: number | (params: { index: number }) => number);
    rowRenderer: (params: {
      index: number;
      key: string;
      style: React.CSSProperties;
    }) => ReactNode;
    overscanRowCount?: number;
    scrollToIndex?: number;
    scrollToAlignment?: 'auto' | 'start' | 'center' | 'end';
    onScroll?: (params: {
      clientHeight: number;
      scrollHeight: number;
      scrollTop: number;
    }) => void;
    style?: React.CSSProperties;
    className?: string;
    containerStyle?: React.CSSProperties;
    containerClassName?: string;
    autoHeight?: boolean;
    scrollToRow?: number;
    onRowsRendered?: (params: {
      startIndex: number;
      stopIndex: number;
    }) => void;
  }

  export interface AutoSizerProps {
    children: (params: { width: number; height: number }) => ReactNode;
    disableHeight?: boolean;
    disableWidth?: boolean;
    onResize?: (params: { height: number; width: number }) => void;
    style?: React.CSSProperties;
    className?: string;
  }

  export const List: ComponentType<ListProps>;
  export const AutoSizer: ComponentType<AutoSizerProps>;
} 