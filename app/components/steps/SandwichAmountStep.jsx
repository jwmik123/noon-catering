"use client";
import React from "react";
import { Users } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const SandwichAmountStep = ({ formData, updateFormData }) => {
  const handlePeopleChange = (people) => {
    const numPeople = parseInt(people) || 0;
    const totalSandwiches = Math.max(numPeople, 15); // 1 per person, minimum 15
    updateFormData("numberOfPeople", numPeople);
    updateFormData("totalSandwiches", totalSandwiches.toString());
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex gap-2 items-center text-lg font-medium text-custom-gray">
        <Users className="w-5 h-5" />
        <h2 className="text-gray-700">How many people?</h2>
      </div>
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex flex-row w-full md:w-1/2">
          {/* Number of People section */}
          <div className="w-full">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="mb-4 w-full">
                <Label htmlFor="peopleSelect">
                  How many people are you ordering for?
                </Label>
                <Select
                  value={formData.numberOfPeople?.toString() || ""}
                  onValueChange={handlePeopleChange}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Select number of people" />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 20, 25, 30, 50, 75, 100, 150, 200, 300].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} people
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-8 w-full">
                <Label htmlFor="peopleInput">Or enter a specific number:</Label>
                <Input
                  id="peopleInput"
                  type="number"
                  min="15"
                  value={formData.numberOfPeople || ""}
                  onChange={(e) => handlePeopleChange(e.target.value)}
                  className="mt-1"
                  placeholder="Enter number of people"
                />
              </div>
            </div>

            <div className="w-full">
              <div className="space-y-6">
                <div className="p-4 text-sm text-green-500 bg-green-50 rounded-md bg-beige-50">
                  <p className="mt-2">Sandwiches cut in half, festively packaged on a platter. We recommend 1 sandwich per person. Because they are cut in half, everyone can taste two different sandwiches.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-6 w-full rounded-lg bg-custom-gray/10 md:w-1/2">
          <h3 className="mb-4 text-lg font-medium text-custom-gray">Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <div>
                <p className="text-sm text-custom-gray">Number of people</p>
                <p className="text-lg font-medium">{formData.numberOfPeople || 0}</p>
                {formData.numberOfPeople < 15 && formData.numberOfPeople > 0 && (
                  <p className="mt-1 text-sm text-red-600">* Minimum 15 people required</p>
                )}
                {formData.numberOfPeople >= 15 && (
                  <p className="mt-1 text-sm text-green-600">
                    = {formData.numberOfPeople} sandwiches (1 per person)
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