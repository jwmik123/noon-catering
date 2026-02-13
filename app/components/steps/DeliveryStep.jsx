"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import DeliveryCalendar from "@/app/components/DeliveryCalendar";
import AddressAutocomplete from "@/app/components/AddressAutocomplete";

const DeliveryStep = ({
  formData,
  updateFormData,
  date,
  setDate,
  setDeliveryCost,
  setDeliveryError,
  totalAmount,
}) => {
  // Check if selected date is a Saturday
  const isSaturday = date && date.getDay() === 6;

  const [googleMapsDeliveryInfo, setGoogleMapsDeliveryInfo] = useState(null);

  const handleDeliveryCostUpdate = (cost, distance) => {
    setDeliveryCost(cost);
    setGoogleMapsDeliveryInfo({ cost, distance });

    // Clear any existing delivery errors when using Google Maps
    if (cost !== null) {
      setDeliveryError(null);
    }
  };
  return (
    <>
      <DeliveryCalendar
        updateFormData={updateFormData}
        date={date}
        setDate={setDate}
        formData={formData}
      />

      <div className="space-y-6">
        {/* Pickup Option */}
        <div className={`p-4 border mt-4 rounded-md ${isSaturday ? 'bg-yellow-50 border-yellow-300' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex gap-2 items-center">
            <Checkbox
              id="isPickup"
              checked={formData.isPickup}
              disabled={isSaturday}
              onCheckedChange={(checked) => {
                updateFormData("isPickup", checked);
                if (checked) {
                  // Clear delivery address and cost when pickup is selected
                  setDeliveryCost(0);
                  setDeliveryError(null);
                  // For pickup orders, we always use invoice address (not delivery address)
                  // Set sameAsDelivery to false to ensure billing address is used
                  updateFormData("sameAsDelivery", false);
                }
              }}
            />
            <Label htmlFor="isPickup" className="text-sm font-medium">
              Bestelling ophalen bij NOON Sandwicherie
              {isSaturday && <span className="ml-2 text-yellow-700">(Alleen ophalen mogelijk op zaterdag)</span>}
            </Label>
          </div>
        </div>

        {/* Only show delivery address fields if not pickup */}
        {!formData.isPickup && (
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Bezorgadres
            </h3>

            <div className="space-y-4">
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
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Adresgegevens:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>Straat: {formData.street}</div>
                    <div>Nummer: {formData.houseNumber}{formData.houseNumberAddition}</div>
                    <div>Postcode: {formData.postalCode}</div>
                    <div>Stad: {formData.city}</div>
                  </div>
                </div>
              )}

              {/* Show delivery cost info */}
              {googleMapsDeliveryInfo && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    📍 Afstand: {googleMapsDeliveryInfo.distance}km
                  </p>
                  <p className="text-sm text-blue-800">
                    🚚 Bezorging: {googleMapsDeliveryInfo.cost === 0
                      ? "Gratis bezorging!"
                      : `€${googleMapsDeliveryInfo.cost}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Invoice Address Section */}
        <div className="pt-6 border-t">
          {formData.isPickup ? (
            // If pickup is selected, only show invoice address fields
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-700">
                Factuuradres
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoiceStreet">Straat</Label>
                  <Input
                    id="invoiceStreet"
                    type="text"
                    value={formData.invoiceStreet}
                    onChange={(e) =>
                      updateFormData("invoiceStreet", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceHouseNumber">Huisnummer</Label>
                    <Input
                      id="invoiceHouseNumber"
                      type="text"
                      value={formData.invoiceHouseNumber}
                      onChange={(e) =>
                        updateFormData("invoiceHouseNumber", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceHouseNumberAddition">Toevoeging</Label>
                    <Input
                      id="invoiceHouseNumberAddition"
                      type="text"
                      value={formData.invoiceHouseNumberAddition}
                      onChange={(e) =>
                        updateFormData(
                          "invoiceHouseNumberAddition",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoicePostalCode">Postcode</Label>
                  <Input
                    id="invoicePostalCode"
                    type="text"
                    value={formData.invoicePostalCode}
                    onChange={(e) =>
                      updateFormData("invoicePostalCode", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceCity">Stad</Label>
                  <Input
                    id="invoiceCity"
                    type="text"
                    value={formData.invoiceCity}
                    onChange={(e) =>
                      updateFormData("invoiceCity", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            // If delivery is selected, show "same as delivery" checkbox
            <>
              <div className="flex gap-2 items-center">
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
                <Label
                  htmlFor="sameAsDelivery"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Factuur- en bezorgadres zijn hetzelfde
                </Label>
              </div>

              {!formData.sameAsDelivery && (
                <div className="mt-6 space-y-6">
                  <h3 className="text-lg font-medium text-gray-700">
                    Factuuradres
                  </h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceStreet">Straat</Label>
                      <Input
                        id="invoiceStreet"
                        type="text"
                        value={formData.invoiceStreet}
                        onChange={(e) =>
                          updateFormData("invoiceStreet", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoiceHouseNumber">Huisnummer</Label>
                        <Input
                          id="invoiceHouseNumber"
                          type="text"
                          value={formData.invoiceHouseNumber}
                          onChange={(e) =>
                            updateFormData("invoiceHouseNumber", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invoiceHouseNumberAddition">Toevoeging</Label>
                        <Input
                          id="invoiceHouseNumberAddition"
                          type="text"
                          value={formData.invoiceHouseNumberAddition}
                          onChange={(e) =>
                            updateFormData(
                              "invoiceHouseNumberAddition",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="invoicePostalCode">Postcode</Label>
                      <Input
                        id="invoicePostalCode"
                        type="text"
                        value={formData.invoicePostalCode}
                        onChange={(e) =>
                          updateFormData("invoicePostalCode", e.target.value)
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invoiceCity">Stad</Label>
                      <Input
                        id="invoiceCity"
                        type="text"
                        value={formData.invoiceCity}
                        onChange={(e) =>
                          updateFormData("invoiceCity", e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DeliveryStep;
