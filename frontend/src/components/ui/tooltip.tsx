'use client';

import * as React from 'react';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { cn } from '@/lib/utils';

function TooltipProvider({ children, delay = 300 }: { children: React.ReactNode; delay?: number }) {
  return <TooltipPrimitive.Provider delay={delay}>{children}</TooltipPrimitive.Provider>;
}

function Tooltip({ children, ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>;
}

const TooltipTrigger = TooltipPrimitive.Trigger;

function TooltipContent({
  className,
  side = 'top',
  sideOffset = 8,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Popup> & {
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner side={side} sideOffset={sideOffset}>
        <TooltipPrimitive.Popup
          className={cn(
            'z-50 rounded-md bg-slate-900 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white shadow-md border border-slate-800 dark:border-slate-700 max-w-xs',
            className,
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

/**
 * Convenience wrapper for the common case: an icon-only button that needs a
 * tooltip label. Renders TooltipTrigger as the button itself (base-ui's
 * Trigger renders a native <button>), so pass button-appropriate props.
 *
 *   <SimpleTooltip label="Refresh" onClick={...} className="...">
 *     <RefreshCw className="w-4 h-4" />
 *   </SimpleTooltip>
 */
function SimpleTooltip({
  label,
  children,
  side,
  className,
  ...triggerProps
}: {
  label: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
} & Omit<React.ComponentProps<typeof TooltipTrigger>, 'children' | 'className'>) {
  return (
    <Tooltip>
      <TooltipTrigger aria-label={label} className={className} {...triggerProps}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, SimpleTooltip };
