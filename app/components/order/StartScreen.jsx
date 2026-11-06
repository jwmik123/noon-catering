"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, FileSearch, Phone, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  fromDateString,
  isDateDisabled,
  nextAvailableDates,
  toDateString,
} from "@/lib/delivery-dates";
import { cn } from "@/lib/utils";
import {
  CATERING_PHONE,
  CATERING_PHONE_HREF,
  CheckItem,
  Chip,
  Heading,
  QuantityStepper,
} from "./ui";

const PEOPLE_PRESETS = [10, 15, 20, 30, 50, 100];

const dayLabel = (date) => {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.getTime() === tomorrow.getTime()) return "Morgen";
  return date.toLocaleDateString("nl-BE", { weekday: "long" });
};

const shortDate = (date, options) =>
  date.toLocaleDateString("nl-BE", { day: "numeric", month: "short", ...options });

function ChoiceCard({ primary, badge, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start gap-1.5 rounded-[12px] p-5 text-left transition-[filter] hover:brightness-[0.97]",
        primary ? "bg-coral text-white" : "bg-blush text-noon"
      )}
    >
      <span
        className={cn(
          "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em]",
          primary ? "bg-white text-coral" : "bg-paper text-noon"
        )}
      >
        {badge}
      </span>
      <span className="mt-1 text-lg font-bold">{title}</span>
      <span className={cn("max-w-[78%] text-[13px] leading-[1.4]", primary ? "text-white" : "text-noon/80")}>
        {subtitle}
      </span>
      <span
        className={cn(
          "absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-[10px]",
          primary ? "bg-white text-coral" : "bg-noon text-cream"
        )}
      >
        <ArrowRight className="h-[18px] w-[18px]" />
      </span>
    </button>
  );
}

export default function StartScreen({ formData, updateFormData, disabledDates, onSelectDate, onChoose }) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  // Worked out in the browser: this page is prerendered, so the build date is no guide.
  const [quickDates, setQuickDates] = useState([]);
  const datesRef = useRef(null);

  useEffect(() => {
    setQuickDates(nextAvailableDates(4, disabledDates));
  }, [disabledDates]);

  // The start screen has its own short footer line instead of the site footer.
  useEffect(() => {
    document.body.dataset.hideFooter = "true";
    return () => {
      delete document.body.dataset.hideFooter;
    };
  }, []);

  // Close the date picker on a click outside it or on Escape.
  useEffect(() => {
    if (!calendarOpen) return;
    const onPointerDown = (event) => {
      if (datesRef.current && !datesRef.current.contains(event.target)) setCalendarOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setCalendarOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [calendarOpen]);

  const handlePeopleChange = (people) => {
    const numPeople = parseInt(people) || 0;
    const totalSandwiches = Math.max(numPeople, 3); // 1 per person, minimum 3
    updateFormData("numberOfPeople", numPeople);
    updateFormData("totalSandwiches", totalSandwiches);
  };

  const people = formData.numberOfPeople || 0;
  const selectedDate = formData.deliveryDate ? fromDateString(formData.deliveryDate) : null;
  const pickedOtherDate =
    selectedDate && !quickDates.some((date) => toDateString(date) === formData.deliveryDate)
      ? selectedDate
      : null;

  return (
    <div className="flex min-h-screen overflow-x-clip bg-cream">
      <div className="flex w-full flex-col lg:w-[54%] lg:shrink-0">
        <header className="flex h-20 items-center justify-between gap-4 px-4 md:h-24 md:px-14">
          <Image
            src="/images/logo-noon-catering.svg"
            alt="NOON Sandwicherie & Koffie"
            width={84}
            height={70}
            className="h-14 w-auto md:h-[70px]"
            priority
          />
          <nav className="flex items-center gap-4 text-[13px] font-medium text-noon lg:hidden">
            <Link href="/quote/lookup" className="flex items-center gap-1.5">
              <FileSearch className="h-3.5 w-3.5" />
              Offerte ophalen
            </Link>
          </nav>
        </header>

        <div className="flex flex-1 flex-col justify-center px-4 pb-8 md:px-14">
          <div className="mx-auto flex w-full max-w-[620px] flex-col gap-7 lg:mx-0">
            <Heading eyebrow="Catering, the noon way" title="Stel je lunch samen" />

            <div className="flex flex-col gap-5 rounded-[14px] border border-noon/10 bg-paper p-5 md:p-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-0.5">
                    <label htmlFor="peopleInput" className="text-[15px] font-semibold text-noon">
                      Voor hoeveel personen?
                    </label>
                    {people >= 3 ? (
                      <span className="text-[13px] text-mist">Wij adviseren 1 broodje per persoon</span>
                    ) : (
                      <span className="text-[13px] text-destructive">Minimum 3 personen vereist</span>
                    )}
                  </div>
                  <QuantityStepper
                    id="peopleInput"
                    label="personen"
                    value={formData.numberOfPeople || ""}
                    onChange={handlePeopleChange}
                    min={3}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {PEOPLE_PRESETS.map((num) => (
                    <Chip
                      key={num}
                      active={people === num}
                      onClick={() => handlePeopleChange(num)}
                      className="h-9 px-3.5"
                    >
                      {num}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="h-px bg-noon/10" />

              <div ref={datesRef} className="relative flex flex-col gap-2.5">
                <span className="text-[15px] font-semibold text-noon">Wanneer?</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {quickDates.length === 0
                    ? [0, 1, 2, 3].map((index) => (
                        <span key={index} className="h-[60px] rounded-[10px] bg-blush/50" />
                      ))
                    : quickDates.map((date) => {
                        const value = toDateString(date);
                        const active = formData.deliveryDate === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => onSelectDate(date)}
                            className={cn(
                              "flex h-[60px] flex-col items-center justify-center rounded-[10px] border transition-colors",
                              active
                                ? "border-noon bg-noon text-cream"
                                : "border-transparent bg-blush/70 text-noon hover:bg-blush"
                            )}
                          >
                            <span className={cn("text-xs capitalize", active ? "opacity-80" : "text-noon/75")}>
                              {dayLabel(date)}
                            </span>
                            <span className="text-sm font-semibold">{shortDate(date)}</span>
                          </button>
                        );
                      })}
                  <button
                    type="button"
                    onClick={() => setCalendarOpen((open) => !open)}
                    aria-expanded={calendarOpen}
                    aria-pressed={!!pickedOtherDate}
                    className={cn(
                      "col-span-2 flex h-[60px] items-center justify-center gap-2 rounded-[10px] border text-[13px] font-medium transition-colors sm:col-span-1",
                      pickedOtherDate
                        ? "border-noon bg-noon text-cream"
                        : "border-dashed border-noon/35 text-noon hover:bg-blush/70"
                    )}
                  >
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    {pickedOtherDate ? shortDate(pickedOtherDate) : "Andere"}
                  </button>
                </div>

                {selectedDate?.getDay() === 6 && (
                  <span className="text-[13px] text-mist">Op zaterdag is alleen ophalen mogelijk.</span>
                )}

                {calendarOpen && (
                  <div
                    role="dialog"
                    aria-label="Kies een datum"
                    className="absolute left-0 top-full z-30 mt-2 flex flex-col gap-2 rounded-[14px] border border-noon/10 bg-paper p-4 shadow-[0_24px_60px_-20px_rgba(47,42,92,0.45)] sm:left-auto sm:right-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-semibold text-noon">Kies een datum</span>
                      <button
                        type="button"
                        aria-label="Sluiten"
                        onClick={() => setCalendarOpen(false)}
                        className="-mr-1 flex h-8 w-8 items-center justify-center rounded-full text-mist hover:bg-blush hover:text-noon"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (!date) return;
                        onSelectDate(date);
                        setCalendarOpen(false);
                      }}
                      disabled={(date) => isDateDisabled(date, disabledDates)}
                      initialFocus
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ChoiceCard
                  primary
                  badge="Snelst"
                  title="Verrassing aanbod"
                  subtitle="Laat ons je verrassen! :)"
                  onClick={() => onChoose("variety")}
                />
                <ChoiceCard
                  badge="Volledig menu"
                  title="Eigen selectie"
                  subtitle="Kies je broodjes uit het hele menu"
                  onClick={() => onChoose("custom")}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 text-[13px] text-noon">
              <CheckItem>Bestel minimaal 24 uur op voorhand</CheckItem>
              <CheckItem>
                Bestel je korter op de dag? Neem even contact met ons op via{" "}
                <a href={CATERING_PHONE_HREF} className="underline underline-offset-2">
                  {CATERING_PHONE}
                </a>
              </CheckItem>
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap gap-x-5 gap-y-1 px-4 pb-6 text-xs text-mist md:px-14">
          <Link href="/terms" className="hover:text-noon">
            Algemene voorwaarden
          </Link>
          <Link href="/privacy" className="hover:text-noon">
            Privacybeleid
          </Link>
          <span>
            Powered by{" "}
            <a
              href="https://mikdevelopment.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-noon hover:underline"
            >
              Mik Development
            </a>
          </span>
        </footer>
      </div>

      <div className="relative hidden flex-1 lg:block">
        <Image
          src="/images/hero-noon-broodjes.jpg"
          alt="Een stapel broodjes van Noon"
          fill
          priority
          sizes="46vw"
          className="object-cover object-[center_60%]"
        />
        <div className="absolute right-6 top-6 flex items-center gap-2 text-[13px] font-medium">
          <a
            href={CATERING_PHONE_HREF}
            className="flex h-10 items-center gap-2 rounded-[10px] bg-cream/90 px-3.5 text-noon hover:bg-cream"
          >
            <Phone className="h-3.5 w-3.5" />
            {CATERING_PHONE}
          </a>
          <Link
            href="/quote/lookup"
            className="flex h-10 items-center gap-2 rounded-[10px] bg-cream/90 px-3.5 text-noon hover:bg-cream"
          >
            <FileSearch className="h-3.5 w-3.5" />
            Offerte ophalen
          </Link>
        </div>
      </div>
    </div>
  );
}
