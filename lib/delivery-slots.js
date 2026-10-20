// Orders must be placed at least this many hours before the delivery/pickup time
export const MIN_LEAD_TIME_HOURS = 24;

// Delivery/pickup slots every 30 minutes between 11:00 and 15:30
export const DELIVERY_TIME_SLOTS = (() => {
  const slots = [];
  for (let hour = 11; hour <= 15; hour++) {
    for (const minutes of ["00", "30"]) {
      slots.push(`${hour.toString().padStart(2, "0")}:${minutes}`);
    }
  }
  return slots;
})();

// Build a local Date from a Date (or "YYYY-MM-DD" string) and an "HH:MM" slot
const slotDateTime = (date, time) => {
  const [year, month, day] =
    typeof date === "string"
      ? date.split("-").map(Number)
      : [date.getFullYear(), date.getMonth() + 1, date.getDate()];
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

export const isSlotBookable = (date, time, now = new Date()) => {
  const earliest = now.getTime() + MIN_LEAD_TIME_HOURS * 60 * 60 * 1000;
  return slotDateTime(date, time).getTime() >= earliest;
};

export const getAvailableTimeSlots = (date, now = new Date()) =>
  date ? DELIVERY_TIME_SLOTS.filter((time) => isSlotBookable(date, time, now)) : [];
