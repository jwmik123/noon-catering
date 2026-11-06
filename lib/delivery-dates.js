import { getAvailableTimeSlots } from "@/lib/delivery-slots";

export const toDateString = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const fromDateString = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// No slot at least 24h away, a Sunday, or a period blocked in Sanity
export const isDateDisabled = (date, disabledDates = []) => {
  if (getAvailableTimeSlots(date).length === 0) return true;
  if (date.getDay() === 0) return true;

  const dateStr = toDateString(date);
  return disabledDates.some((period) =>
    period.endDate
      ? dateStr >= period.startDate && dateStr <= period.endDate
      : dateStr === period.startDate
  );
};

export const nextAvailableDates = (count, disabledDates = [], from = new Date()) => {
  const dates = [];
  const day = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i < 90 && dates.length < count; i++) {
    if (!isDateDisabled(day, disabledDates)) dates.push(new Date(day));
    day.setDate(day.getDate() + 1);
  }
  return dates;
};
