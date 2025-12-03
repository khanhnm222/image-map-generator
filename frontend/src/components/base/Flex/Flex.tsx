import { sx } from '../../../lib';
import React from 'react';

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={sx('flex', className)} {...props} />
  )
);

Flex.displayName = 'Flex';
