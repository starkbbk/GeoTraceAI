import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-md border border-white/10 bg-white/[0.06] px-3 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-accent-300/60 focus:bg-white/[0.09] focus:ring-2 focus:ring-accent-400/20",
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
