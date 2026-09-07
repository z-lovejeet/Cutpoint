import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-xs font-mono font-medium text-text-secondary tracking-wide uppercase select-none flex items-center gap-1",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      {required && <span className="text-danger font-bold leading-none">*</span>}
    </label>
  )
);
Label.displayName = "Label";
