import { sx } from '../../../lib';
import React from 'react';

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={sx(className)} {...props} />
  )
);

Box.displayName = 'Box';
