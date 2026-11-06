"use client";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { client } from "@/sanity/lib/client";
import { PRODUCT_QUERY, BREAD_TYPES_QUERY, SAUCE_TYPES_QUERY, TOPPING_TYPES_QUERY, PRICING_QUERY, SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import Wizard from "@/app/components/wizard/Wizard";
import StartScreen from "@/app/components/order/StartScreen";
import SelectionTypeStep from "@/app/components/steps/SelectionTypeStep";
import OrderSummaryStep from "@/app/components/steps/OrderSummaryStep";
import DeliveryStep from "@/app/components/steps/DeliveryStep";
import ContactStep from "@/app/components/steps/ContactStep";
import PaymentStep from "@/app/components/steps/PaymentStep";
import { useOrderForm } from "@/app/hooks/useOrderForm";
import { useOrderValidation } from "@/app/hooks/useOrderValidation";
import { toDateString } from "@/lib/delivery-dates";

// Step 1 is the start screen at "/"; every later step has its own address.
const START = 1;
const SELECTION = 2;
const OVERVIEW = 3;
const STEP_PARAMS = {
  [SELECTION]: "keuze",
  [OVERVIEW]: "samenvatting",
  4: "levering",
  5: "gegevens",
  6: "betaling",
};
const STEP_BY_PARAM = Object.fromEntries(
  Object.entries(STEP_PARAMS).map(([step, param]) => [param, Number(step)])
);

const Home = () => {
  const [sandwichOptions, setSandwichOptions] = useState([]);
  const [breadTypes, setBreadTypes] = useState([]);
  const [sauceTypes, setSauceTypes] = useState([]);
  const [toppingTypes, setToppingTypes] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [disabledDates, setDisabledDates] = useState([]);
  const [date, setDate] = useState(null);
  const {
    formData,
    updateFormData,
    deliveryCost,
    setDeliveryCost,
    deliveryError,
    setDeliveryError,
    totalAmount,
    appliedCoupon,
    setAppliedCoupon,
    discountAmount,
    restoreQuote,
  } = useOrderForm(pricing);

  const { isStepValid, getValidationMessage } = useOrderValidation(formData, deliveryError, deliveryCost);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [products, breads, sauces, toppings, pricingData, siteSettings] = await Promise.all([
          client.fetch(PRODUCT_QUERY),
          client.fetch(BREAD_TYPES_QUERY),
          client.fetch(SAUCE_TYPES_QUERY),
          client.fetch(TOPPING_TYPES_QUERY),
          client.fetch(PRICING_QUERY),
          client.fetch(SITE_SETTINGS_QUERY),
        ]);

        setSandwichOptions(products);
        setBreadTypes(breads);
        setSauceTypes(sauces);
        setToppingTypes(toppings);
        setPricing(pricingData);
        setDisabledDates(siteSettings?.disabledDates || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const [currentStep, setCurrentStep] = useState(() => {
    // Check if we're restoring a quote (client-side only)
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      return searchParams.get("restore") ? OVERVIEW : START;
    }
    return START;
  });

  // Every step gets its own browser history entry, so the browser's back and
  // forward buttons move between the steps instead of leaving the site.
  // Native pushState keeps this page mounted (Next.js patches it to stay in
  // sync); the step is always read back from the URL.
  const stepFromUrl = () => {
    const param = new URLSearchParams(window.location.search).get("step");
    return STEP_BY_PARAM[param] || START;
  };
  const writeStepToHistory = (step, replace) => {
    const url = step === START ? "/" : `/?step=${STEP_PARAMS[step]}`;
    // Already on this step: no extra entry.
    const same = stepFromUrl() === step && !window.location.search.includes("restore");
    window.history[replace || same ? "replaceState" : "pushState"](null, "", url);
  };
  const goToStep = (step, { replace = false } = {}) => {
    setCurrentStep(step);
    if (typeof window === "undefined") return;
    // Next.js hooks into history after this page's first effects have run.
    window.setTimeout(() => writeStepToHistory(step, replace), 0);
  };

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // After a refresh the order is gone, so always start at the beginning.
    // (A restored quote rewrites the URL itself once it is loaded.)
    if (params.get("step") && !params.get("restore")) goToStep(START, { replace: true });

    const onPopState = () => {
      let step = stepFromUrl();
      // Nothing to show on a later step without an order in progress.
      if (step !== START && !formDataRef.current.selectionType) {
        step = START;
        window.history.replaceState(null, "", "/");
      }
      setCurrentStep(step);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // Once, on mount.
  }, []);

  useEffect(() => {
    // Handle quote restoration
    const wasRestored = restoreQuote();
    if (wasRestored) {
      goToStep(OVERVIEW, { replace: true });
    }
  }, [restoreQuote]);

  const handleSelectDate = (selectedDate) => {
    if (!selectedDate) return;

    setDate(selectedDate);
    updateFormData("deliveryDate", toDateString(selectedDate));
    // Reset time when date changes
    updateFormData("deliveryTime", "");

    // If Saturday is selected (day 6), automatically enable pickup mode
    if (selectedDate.getDay() === 6) {
      updateFormData("isPickup", true);
    }
  };

  const handleChooseType = (selectionType) => {
    if (!isStepValid(START)) {
      toast.error("Minimum 3 personen vereist", { toastId: "start-validation" });
      return;
    }
    updateFormData("selectionType", selectionType);
    goToStep(SELECTION);
  };

  // Add useEffect to handle scrolling to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const steps = [
    { title: "Personen" },
    { title: "Keuze" },
    { title: "Samenvatting" },
    { title: "Levering" },
    { title: "Gegevens" },
    { title: "Betaling" },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 2:
        return (
          <SelectionTypeStep
            formData={formData}
            updateFormData={updateFormData}
            sandwichOptions={sandwichOptions}
            breadTypes={breadTypes}
            sauceTypes={sauceTypes}
            toppingTypes={toppingTypes}
            pricing={pricing}
          />
        );
      case 3:
        return (
          <OrderSummaryStep
            formData={formData}
            updateFormData={updateFormData}
            setCurrentStep={goToStep}
            sandwichOptions={sandwichOptions}
            breadTypes={breadTypes}
            sauceTypes={sauceTypes}
            toppingTypes={toppingTypes}
            totalAmount={totalAmount}
            pricing={pricing}
          />
        );
      case 4:
        return (
          <DeliveryStep
            formData={formData}
            updateFormData={updateFormData}
            date={date}
            onSelectDate={handleSelectDate}
            setDeliveryCost={setDeliveryCost}
            setDeliveryError={setDeliveryError}
            totalAmount={totalAmount}
            disabledDates={disabledDates}
          />
        );
      case 5:
        return (
          <ContactStep
            formData={formData}
            updateFormData={updateFormData}
            sandwichOptions={sandwichOptions}
            deliveryCost={deliveryCost}
            totalAmount={totalAmount}
          />
        );
      case 6:
        return (
          <PaymentStep
            formData={formData}
            updateFormData={updateFormData}
            totalAmount={totalAmount}
            deliveryCost={deliveryCost}
            deliveryError={deliveryError}
            appliedCoupon={appliedCoupon}
            setAppliedCoupon={setAppliedCoupon}
            discountAmount={discountAmount}
          />
        );
      default:
        return null;
    }
  };

  if (currentStep === START) {
    return (
      <StartScreen
        formData={formData}
        updateFormData={updateFormData}
        disabledDates={disabledDates}
        onSelectDate={handleSelectDate}
        onChoose={handleChooseType}
      />
    );
  }

  return (
    <>
      <Wizard
        currentStep={currentStep}
        setCurrentStep={goToStep}
        steps={steps}
        isStepValid={isStepValid}
        getValidationMessage={getValidationMessage}
        totalAmount={totalAmount}
      >
        {renderStepContent()}
      </Wizard>

    </>
  );
};

export default Home;
