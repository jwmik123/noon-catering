"use client";
import React from "react";
import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const CATERING_PHONE = "09 324 88 20";
export const CATERING_PHONE_HREF = "tel:+3293248820";

export const formatEuro = (value) => `€${(Number(value) || 0).toFixed(2)}`;

export function Heading({ eyebrow, title, lead, as: Tag = "h1", size = "lg", className }) {
  const sizes = {
    lg: "text-[34px] md:text-[46px]",
    md: "text-[26px] md:text-[32px]",
  };
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <Tag className={cn("m-0 font-display font-normal leading-[1.15] tracking-[0.02em] text-noon", sizes[size])}>
        {title}
      </Tag>
      {lead && <p className="m-0 max-w-xl font-lead text-[15px] leading-[1.6] text-noon md:text-base">{lead}</p>}
    </div>
  );
}

export function Card({ className, children, ...props }) {
  return (
    <div className={cn("rounded-[14px] border border-noon/10 bg-paper", className)} {...props}>
      {children}
    </div>
  );
}

export function QuantityStepper({ value, onChange, step = 1, min = 0, label, size = "md", id }) {
  const numeric = Number(value) || 0;
  const setValue = (next) => onChange(Math.max(min, next));
  const dimensions = size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <div className="inline-flex items-center gap-0.5 rounded-[12px] bg-blush p-1">
      <button
        type="button"
        aria-label={`Minder ${label}`}
        onClick={() => setValue(numeric - step)}
        disabled={numeric <= min}
        className={cn(
          "flex items-center justify-center rounded-[9px] bg-paper text-noon transition-opacity disabled:opacity-50",
          dimensions
        )}
      >
        <Minus className="h-4 w-4" strokeWidth={2.4} />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value, 10) || 0))}
        onBlur={() => setValue(numeric)}
        className={cn(
          "bg-transparent text-center font-semibold tabular-nums text-noon outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          size === "lg" ? "w-[72px] text-2xl" : "w-10 text-base"
        )}
      />
      <button
        type="button"
        aria-label={`Meer ${label}`}
        onClick={() => setValue(numeric + step)}
        className={cn(
          "flex items-center justify-center rounded-[9px] bg-noon text-cream transition-colors hover:bg-noon-dark",
          dimensions
        )}
      >
        <Plus className="h-4 w-4" strokeWidth={2.4} />
      </button>
    </div>
  );
}

export function Chip({ active, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "h-10 whitespace-nowrap rounded-[10px] border px-4 text-sm font-medium transition-colors disabled:opacity-40",
        active
          ? "border-noon bg-noon text-cream"
          : "border-transparent bg-blush/60 text-noon hover:bg-blush",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// The main action: the same button as on noonsandwicherie.be. Salmon is only
// ever paired with white, never with the purple.
export function PrimaryButton({ children, className, disabled, loading, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "flex h-12 items-center justify-center gap-2 rounded-[10px] bg-coral px-6 text-[13px] font-bold uppercase tracking-[0.1em] text-white transition-[filter] hover:brightness-95 disabled:opacity-50",
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-12 items-center justify-center gap-2 rounded-[10px] bg-blush px-5 text-sm font-semibold text-noon transition-colors hover:bg-[#E4D3D0] disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ProgressBar({ value, className }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-blush", className)}>
      <div
        className="h-full rounded-full bg-coral transition-[width] duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function CheckItem({ children }) {
  return (
    <span className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-noon" strokeWidth={2.6} />
      <span>{children}</span>
    </span>
  );
}

// One option in a group of choices: delivery or pick up, how to pay, ...
export function OptionCard({ active, title, subtitle, disabled, onClick, className }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[12px] border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        active ? "border-noon bg-blush" : "border-noon/15 hover:border-noon/40",
        className
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          active ? "border-noon bg-noon" : "border-noon/30 bg-paper"
        )}
      >
        {active && <span className="h-2 w-2 rounded-full bg-cream" />}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[15px] font-semibold text-noon">{title}</span>
        {subtitle && (
          <span className={cn("text-[13px] leading-[1.4]", active ? "text-noon/80" : "text-mist")}>
            {subtitle}
          </span>
        )}
      </span>
    </button>
  );
}

const NOTICE_TONES = {
  neutral: "bg-blush/60 text-noon-dark",
  success: "bg-leaf-soft text-leaf",
  warning: "bg-blush text-noon-dark",
};

export function Notice({ tone = "neutral", className, children }) {
  return (
    <div className={cn("rounded-[10px] px-4 py-3 text-sm leading-[1.5]", NOTICE_TONES[tone], className)}>
      {children}
    </div>
  );
}
