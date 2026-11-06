import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, Chip } from "@/app/components/order/ui";
import { isDateDisabled } from "@/lib/delivery-dates";
import { getAvailableTimeSlots } from "@/lib/delivery-slots";

const DeliveryCalendar = ({ date, onSelectDate, updateFormData, formData, disabledDates = [] }) => {
  const timeSlots = getAvailableTimeSlots(date).map((value) => ({
    value,
    label: value,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_minmax(0,1fr)]">
      <Card className="flex flex-col gap-3 p-5">
        <span className="text-[15px] font-semibold text-noon">Datum</span>
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelectDate}
          disabled={(day) => isDateDisabled(day, disabledDates)}
          className="mx-auto"
          initialFocus
        />
      </Card>
      <Card className="flex flex-col gap-3 p-5">
        <span className="text-[15px] font-semibold text-noon">Tijdstip</span>
        {!date ? (
          <p className="m-0 text-sm text-mist">Kies eerst een datum.</p>
        ) : timeSlots.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-4">
            {timeSlots.map((slot) => (
              <Chip
                key={slot.value}
                active={formData.deliveryTime === slot.value}
                onClick={() => updateFormData("deliveryTime", slot.value)}
                className="px-2 tabular-nums"
              >
                {slot.label}
              </Chip>
            ))}
          </div>
        ) : (
          <p className="m-0 text-sm text-mist">Geen tijdstippen beschikbaar op deze dag.</p>
        )}
      </Card>
    </div>
  );
};

export default DeliveryCalendar;
