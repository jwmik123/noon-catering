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
  deliveryError,
  deliveryCost,
  setDeliveryCost,
  setDeliveryError,
  totalAmount,
}) => {
  const [useGoogleMaps, setUseGoogleMaps] = useState(true);

  // Clear delivery error when switching to Google Maps mode
  const handleGoogleMapsToggle = (checked) => {
    setUseGoogleMaps(checked);
    if (checked) {
      // Clear any existing delivery errors when switching to Google Maps
      setDeliveryError(null);
      updateFormData("usingGoogleMaps", true);
    } else {
      updateFormData("usingGoogleMaps", false);
    }
  };
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
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex gap-2 items-center">
            <Checkbox
              id="isPickup"
              checked={formData.isPickup}
              onCheckedChange={(checked) => {
                updateFormData("isPickup", checked);
                if (checked) {
                  // Clear delivery address and cost when pickup is selected
                  setDeliveryCost(0);
                  setDeliveryError(null);
                }
              }}
            />
            <Label htmlFor="isPickup" className="text-sm font-medium">
              Pick up order at NOON Sandwicherie (5% discount)
            </Label>
          </div>
        </div>

        {/* Only show delivery address fields if not pickup */}
        {!formData.isPickup && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-700">
                Delivery Address
              </h3>
              <div className="flex gap-2 items-center">
                <Checkbox
                  id="useGoogleMaps"
                  checked={useGoogleMaps}
                  onCheckedChange={handleGoogleMapsToggle}
                />
                <Label htmlFor="useGoogleMaps" className="text-sm">
                  Smart address lookup
                </Label>
              </div>
            </div>

          {useGoogleMaps ? (
            <div className="space-y-4">
              <AddressAutocomplete
                formData={formData}
                updateFormData={updateFormData}
                onDeliveryCostUpdate={handleDeliveryCostUpdate}
                totalAmount={totalAmount}
                label="Delivery Address"
                placeholder="Start typing your address in Gent..."
              />

              {/* Show current address components if filled */}
              {(formData.street || formData.houseNumber || formData.postalCode || formData.city) && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Address Details:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>Street: {formData.street}</div>
                    <div>Number: {formData.houseNumber}{formData.houseNumberAddition}</div>
                    <div>Postal Code: {formData.postalCode}</div>
                    <div>City: {formData.city}</div>
                  </div>
                </div>
              )}

              {/* Show delivery cost info */}
              {googleMapsDeliveryInfo && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    📍 Distance: {googleMapsDeliveryInfo.distance}km
                  </p>
                  <p className="text-sm text-blue-800">
                    🚚 Delivery: {googleMapsDeliveryInfo.cost === 0
                      ? "Free delivery!"
                      : `€${googleMapsDeliveryInfo.cost}`}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="street">Street</Label>
                  <Input
                    id="street"
                    type="text"
                    value={formData.street}
                    onChange={(e) => updateFormData("street", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="houseNumber">House number</Label>
                    <Input
                      id="houseNumber"
                      type="text"
                      value={formData.houseNumber}
                      onChange={(e) =>
                        updateFormData("houseNumber", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="houseNumberAddition">Addition</Label>
                    <Input
                      id="houseNumberAddition"
                      type="text"
                      value={formData.houseNumberAddition}
                      onChange={(e) =>
                        updateFormData("houseNumberAddition", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postcode</Label>
                  <Input
                    id="postalCode"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => updateFormData("postalCode", e.target.value)}
                    required
                  />
                  {deliveryError && (
                    <p className="mt-1 text-sm text-red-500">{deliveryError}</p>
                  )}
                  {deliveryCost === 0 && (
                    <p className="mt-1 text-sm text-green-500">Free delivery!</p>
                  )}
                  {deliveryCost > 0 && (
                    <p className="mt-1 text-sm text-gray-600">
                      Delivery cost: €{deliveryCost.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          )}
          </div>
        )}

        <div className="pt-6 border-t">
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
              Invoice and delivery address are the same
            </Label>
          </div>

          {!formData.sameAsDelivery && (
            <div className="mt-6 space-y-6">
              <h3 className="text-lg font-medium text-gray-700">
                Invoice Address
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invoiceStreet">Street</Label>
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
                    <Label htmlFor="invoiceHouseNumber">House number</Label>
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
                    <Label htmlFor="invoiceHouseNumberAddition">Addition</Label>
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
                  <Label htmlFor="invoiceCity">City</Label>
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
        </div>
      </div>
    </>
  );
};

export default DeliveryStep; 