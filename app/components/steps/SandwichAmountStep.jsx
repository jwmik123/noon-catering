"use client";
import React from "react";
import { Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const SandwichAmountStep = ({ formData, updateFormData }) => {
  const handlePeopleChange = (people) => {
    const numPeople = parseInt(people) || 0;
    const totalSandwiches = Math.max(numPeople, 3); // 1 per person, minimum 3
    updateFormData("numberOfPeople", numPeople);
    updateFormData("totalSandwiches", totalSandwiches);
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex gap-2 items-center text-lg font-medium text-custom-gray">
        <Users className="w-5 h-5" />
        <h2 className="text-gray-700">Hoeveel personen?</h2>
      </div>
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex flex-row w-full md:w-1/2">
          {/* Number of People section */}
          <div className="w-full">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="mb-4 w-full">
                <Label htmlFor="peopleSelect">
                  Voor hoeveel personen bestel je?
                </Label>
                <Select
                  value={formData.numberOfPeople?.toString() || ""}
                  onValueChange={handlePeopleChange}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Selecteer aantal personen" />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 10, 15, 20, 25, 30, 50, 75, 100, 150, 200, 300].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} personen
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-8 w-full">
                <Label htmlFor="peopleInput">Of voer een specifiek aantal in:</Label>
                <Input
                  id="peopleInput"
                  type="number"
                  min="3"
                  value={formData.numberOfPeople || ""}
                  onChange={(e) => handlePeopleChange(e.target.value)}
                  className="mt-1"
                  placeholder="Voer aantal personen in"
                />
              </div>
            </div>

            <div className="w-full">
              <div className="space-y-6">
                <div className="p-4 text-sm text-green-500 bg-green-50 rounded-md bg-beige-50">
                  <p className="mt-2">
                  Welkom bij Noon Catering! <br /> <br />
                  Maak een keuze voor hoeveel personen u wilt bestellen. Wij adviseren 1 broodje per persoon. Voeg een extra dessertje of drankje toe voor een complete ervaring. <br />
                   Bestel minimaal 24 uur op voorhand. <br /> <br />
                    Korter dag? Neem even contact met ons op via 09 324 88 20.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-6 w-full rounded-lg bg-custom-gray/10 md:w-1/2">
          <h3 className="mb-4 text-lg font-medium text-custom-gray">Samenvatting</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <div>
                <p className="text-sm text-custom-gray">Aantal personen</p>
                <p className="text-lg font-medium">{formData.numberOfPeople || 0}</p>
                {formData.numberOfPeople < 3 && formData.numberOfPeople > 0 && (
                  <p className="mt-1 text-sm text-red-600">* Minimum 3 personen vereist</p>
                )}
                {formData.numberOfPeople >= 3 && (
                  <p className="mt-1 text-sm text-green-600">
                    = {formData.numberOfPeople} broodjes (1 per persoon)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SandwichAmountStep; 