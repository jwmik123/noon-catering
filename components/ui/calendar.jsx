import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  const [month, setMonth] = React.useState(props.selected || new Date());

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("relative w-fit", className)}
      month={month}
      onMonthChange={setMonth}
      weekStartsOn={1}
      locale={nl}
      classNames={{
        months: "flex",
        month: "space-y-3",
        month_caption: "flex h-9 items-center justify-center",
        caption_label: "font-lead text-sm capitalize text-noon",
        nav: "absolute inset-x-0 top-0 z-10 flex justify-between",
        button_previous:
          "flex h-9 w-9 items-center justify-center rounded-[10px] text-noon hover:bg-blush disabled:opacity-30",
        button_next:
          "flex h-9 w-9 items-center justify-center rounded-[10px] text-noon hover:bg-blush disabled:opacity-30",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-10 text-[11px] font-semibold uppercase tracking-[0.06em] text-mist",
        week: "mt-1 flex w-full",
        day: "relative h-10 w-10 p-0 text-center text-sm",
        day_button:
          "h-10 w-10 rounded-[10px] font-medium text-noon-dark transition-colors hover:bg-blush disabled:hover:bg-transparent",
        selected:
          "[&>button]:bg-noon [&>button]:text-cream [&>button]:hover:bg-noon",
        today: "[&>button]:font-bold [&>button]:underline [&>button]:decoration-noon [&>button]:underline-offset-4",
        outside: "opacity-40",
        disabled: "opacity-30",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-4 w-4" {...props} />;
          }
          return <ChevronRight className="h-4 w-4" {...props} />;
        },
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
