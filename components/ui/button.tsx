import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border font-medium transition focus:outline-none focus:ring-2 focus:ring-accent-400/70 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "border-accent-300/30 bg-accent-500 text-white shadow-[0_0_24px_rgba(13,126,242,0.32)] hover:bg-accent-400",
        variant === "secondary" &&
          "border-white/10 bg-white/[0.07] text-slate-100 hover:bg-white/[0.12]",
        variant === "ghost" &&
          "border-transparent bg-transparent text-slate-300 hover:bg-white/[0.08] hover:text-white",
        variant === "danger" &&
          "border-red-400/30 bg-red-500/15 text-red-100 hover:bg-red-500/25",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-12 px-5 text-base",
        size === "icon" && "h-10 w-10 p-0",
        className
      )}
      {...props}
    />
  );
}
