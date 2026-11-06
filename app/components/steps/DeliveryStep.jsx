"use client";
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import DeliveryCalendar from "@/app/components/DeliveryCalendar";
import AddressAutocomplete from "@/app/components/AddressAutocomplete";
import { Card, Heading, Notice, OptionCard } from "@/app/components/order/ui";

const InvoiceAddressFields = ({ formData, updateFormData }) => {
  const field = (id, name, label, required = true) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        value={formData[name]}
        onChange={(e) => updateFormData(name, e.target.value)}
        required={required}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <h3 className="m-0 text-[15px] font-semibold text-noon">Factuuradres</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {field("invoiceStreet", "invoiceStreet", "Straat")}
        <div className="grid grid-cols-2 gap-4">
          {field("invoiceHouseNumber", "invoiceHouseNumber", "Huisnummer")}
          {field("invoiceHouseNumberAddition", "invoiceHouseNumberAddition", "Toevoeging", false)}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {field("invoicePostalCode", "invoicePostalCode", "Postcode")}
        {field("invoiceCity", "invoiceCity", "Stad")}
      </div>
    </div>
  );
};

const DeliveryStep = ({
  formData,
  updateFormData,
  date,
  onSelectDate,
  setDeliveryCost,
  setDeliveryError,
  totalAmount,
  disabledDates,
}) => {
  // Check if selected date is a Saturday
  const isSaturday = date && date.getDay() === 6;

  const handleDeliveryCostUpdate = (cost) => {
    setDeliveryCost(cost);

    // Clear any existing delivery errors when using Google Maps
    if (cost !== null) {
      setDeliveryError(null);
    }
  };

  const choosePickup = () => {
    updateFormData("isPickup", true);
    // Clear delivery address and cost when pickup is selected
    setDeliveryCost(0);
    setDeliveryError(null);
    // For pickup orders, we always use invoice address (not delivery address)
    // Set sameAsDelivery to false to ensure billing address is used
    updateFormData("sameAsDelivery", false);
  };

  return (
    <div className="flex flex-col gap-8">
      <Heading title="Levering" />

      <DeliveryCalendar
        updateFormData={updateFormData}
        date={date}
        onSelectDate={onSelectDate}
        formData={formData}
        disabledDates={disabledDates}
      />

      <div className="flex flex-col gap-2.5">
        <span className="text-[15px] font-semibold text-noon">Bezorgen of ophalen?</span>
        <div role="radiogroup" aria-label="Bezorgen of ophalen" className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <OptionCard
            active={!formData.isPickup}
            disabled={isSaturday}
            title="Bezorgen"
            subtitle={isSaturday ? "Niet mogelijk op zaterdag" : "Op jouw locatie in en rond Gent"}
            onClick={() => updateFormData("isPickup", false)}
          />
          <OptionCard
            active={formData.isPickup}
            disabled={isSaturday}
            title="Ophalen bij NOON Sandwicherie"
            subtitle={isSaturday ? "Alleen ophalen mogelijk op zaterdag" : "Keizer Leopoldstraat 1, Gent"}
            onClick={choosePickup}
          />
        </div>
      </div>

      {/* Only show delivery address fields if not pickup */}
      {!formData.isPickup && (
        <div className="flex flex-col gap-3">
          <AddressAutocomplete
            formData={formData}
            updateFormData={updateFormData}
            onDeliveryCostUpdate={handleDeliveryCostUpdate}
            totalAmount={totalAmount}
            label="Bezorgadres"
            placeholder="Begin met typen van je adres in Gent..."
          />

          {/* Show current address components if filled */}
          {(formData.street || formData.houseNumber || formData.postalCode || formData.city) && (
            <Notice>
              {formData.street} {formData.houseNumber}
              {formData.houseNumberAddition}, {formData.postalCode} {formData.city}
            </Notice>
          )}
        </div>
      )}

      {/* Invoice Address Section */}
      <Card className="flex flex-col gap-5 p-5 md:p-6">
        {formData.isPickup ? (
          // If pickup is selected, only show invoice address fields
          <InvoiceAddressFields formData={formData} updateFormData={updateFormData} />
        ) : (
          // If delivery is selected, show "same as delivery" checkbox
          <>
            <div className="flex items-center gap-3">
              <Checkbox
                id="sameAsDelivery"
                checked={formData.sameAsDelivery}
                onCheckedChange={(checked) => {
                  updateFormData("sameAsDelivery", checked);
                  if (checked) {
                    // Copy delivery address to invoice address
                    updateFormData("invoiceStreet", formData.street);
                    updateFormData("invoiceHouseNumber", formData.houseNumber);
                    updateFormData(
                      "invoiceHouseNumberAddition",
                      formData.houseNumberAddition
                    );
                    updateFormData("invoicePostalCode", formData.postalCode);
                    updateFormData("invoiceCity", formData.city);
                  }
                }}
              />
              <Label htmlFor="sameAsDelivery" className="text-sm font-medium text-noon">
                Factuur- en bezorgadres zijn hetzelfde
              </Label>
            </div>

            {!formData.sameAsDelivery && (
              <InvoiceAddressFields formData={formData} updateFormData={updateFormData} />
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default DeliveryStep;
