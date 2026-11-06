"use client";
import React from "react";
import { Check, ChevronLeft, ChevronRight, Phone } from "lucide-react";
import Image from "next/image";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import {
  CATERING_PHONE,
  CATERING_PHONE_HREF,
  PrimaryButton,
  formatEuro,
} from "@/app/components/order/ui";

const Wizard = ({
  currentStep,
  setCurrentStep,
  steps,
  children,
  isStepValid,
  getValidationMessage,
  totalAmount,
}) => {
  const handleNextStep = () => {
    const validationMessage = getValidationMessage(currentStep);
    if (!isStepValid(currentStep) && validationMessage) {
      toast.error(validationMessage);
    } else if (isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const isLastStep = currentStep === steps.length;
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="flex min-h-[70vh] flex-col bg-cream">
      <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-6 px-4 md:h-20 md:px-8">
          <Image
            src="/images/logo-noon-catering.svg"
            alt="NOON Sandwicherie & Koffie"
            width={72}
            height={60}
            className="h-12 w-auto md:h-[60px]"
            priority
          />

          <ol className="hidden items-center gap-7 lg:flex">
            {steps.map((step, index) => {
              const number = index + 1;
              const done = number < currentStep;
              const active = number === currentStep;
              return (
                <li
                  key={step.title}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "eyebrow flex items-center gap-1.5 transition-colors",
                    active ? "text-noon" : done ? "text-noon/70" : "text-noon/35"
                  )}
                >
                  {done && <Check className="h-3.5 w-3.5 text-noon/70" strokeWidth={3} />}
                  {step.title}
                </li>
              );
            })}
          </ol>

          <span className="text-[13px] text-mist lg:hidden">
            Stap {currentStep} van {steps.length} · {steps[currentStep - 1]?.title}
          </span>

          <a
            href={CATERING_PHONE_HREF}
            className="hidden items-center gap-2 text-[13px] font-medium text-noon hover:text-noon-dark sm:flex"
          >
            <Phone className="h-3.5 w-3.5" />
            {CATERING_PHONE}
          </a>
        </div>
        <div className="h-0.5 bg-blush">
          <div
            className="h-full bg-coral transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 md:px-8 md:py-12">{children}</div>

      {/* Back and next stay in view, also on the long menu */}
      <div className="sticky bottom-0 z-30 border-t border-noon/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center gap-4 px-4 md:px-8">
          <button
            type="button"
            onClick={handlePrevStep}
            className="flex h-12 items-center gap-1 rounded-[10px] pr-3 text-sm font-semibold text-noon hover:text-noon-dark"
          >
            <ChevronLeft className="h-4 w-4" />
            Terug
          </button>

          {totalAmount > 0 && !isLastStep && (
            <span className="ml-auto text-right leading-tight">
              <span className="block text-base font-bold tabular-nums text-noon">
                {formatEuro(totalAmount)}
              </span>
              <span className="block text-[11px] text-mist">excl. btw</span>
            </span>
          )}

          {!isLastStep && (
            <PrimaryButton
              onClick={handleNextStep}
              className={cn(
                "shrink-0",
                !(totalAmount > 0) && "ml-auto",
                !isStepValid(currentStep) && "opacity-50"
              )}
            >
              {currentStep === steps.length - 1 ? "Naar betaling" : "Volgende"}
              <ChevronRight className="-mr-1 h-4 w-4" strokeWidth={2.6} />
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wizard;
