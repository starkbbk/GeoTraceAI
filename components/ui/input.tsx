import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-white/10 bg-white/[0.06] px-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-accent-300/60 focus:bg-white/[0.09] focus:ring-2 focus:ring-accent-400/20",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
