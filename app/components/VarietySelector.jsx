import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { HelpCircle } from "lucide-react";

const VarietySelector = ({ totalSandwiches, formData, updateFormData }) => {
  const [selectedTypes, setSelectedTypes] = useState({
    meat: false,
    chicken: false,
    fish: false,
    veggie: false,
    vegan: false,
  });

  const [suggestedDistribution, setSuggestedDistribution] = useState({
    meat: 0,
    chicken: 0,
    fish: 0,
    veggie: 0,
    vegan: 0,
  });

  // Calculate suggested distributions when selections change
  useEffect(() => {
    const selectedCount = Object.values(selectedTypes).filter(Boolean).length;
    if (selectedCount === 0) {
      setSuggestedDistribution({
        nonVega: 0,
        vega: 0,
        vegan: 0,
      });
      return;
    }

    const portionSize = Math.floor(totalSandwiches / selectedCount);
    const remainder = totalSandwiches % selectedCount;

    const newDistribution = {
      meat: selectedTypes.meat ? portionSize : 0,
      chicken: selectedTypes.chicken ? portionSize : 0,
      fish: selectedTypes.fish ? portionSize : 0,
      veggie: selectedTypes.veggie ? portionSize : 0,
      vegan: selectedTypes.vegan ? portionSize : 0,
    };

    // Distribute remainder if any
    if (remainder > 0) {
      Object.keys(selectedTypes).forEach((type, index) => {
        if (selectedTypes[type] && index < remainder) {
          newDistribution[type] += 1;
        }
      });
    }

    setSuggestedDistribution(newDistribution);

    // Update the actual form values with the suggested distribution
    updateFormData("varietySelection", newDistribution);
  }, [selectedTypes, totalSandwiches]);

  const handleCheckChange = (type, checked) => {
    const newSelectedTypes = {
      ...selectedTypes,
      [type]: checked,
    };
    setSelectedTypes(newSelectedTypes);
  };

  const handleInputChange = (field, value) => {
    const numValue = value === "" ? 0 : Math.max(0, parseInt(value) || 0);
    updateFormData("varietySelection", {
      ...formData.varietySelection,
      [field]: numValue,
    });
  };

  const currentTotal = Object.values(formData.varietySelection).reduce(
    (sum, val) => sum + (val || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="relative group">
        <div className="absolute top-0 right-0 p-2 transition-colors rounded-full hover:bg-blue-50">
          <HelpCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div className="absolute right-0 z-10 invisible w-64 p-4 mt-2 transition-all duration-200 bg-white rounded-lg shadow-lg opacity-0 top-full group-hover:opacity-100 group-hover:visible">
          <p className="text-sm text-gray-700">
            Our variety offer lets you choose the distribution of sandwich
            types. We'll select the best sandwiches from each category to create
            a balanced and delicious selection for you.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-6">
          <div className="flex flex-col">
            <Label htmlFor="meat" className="text-base font-bold">
              Meat
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="meat"
                checked={selectedTypes.meat}
                onCheckedChange={(checked) =>
                  handleCheckChange("meat", checked)
                }
              />
              <div className="flex-1">
                <div className="flex items-center mt-2">
                  <Input
                    type="number"
                    value={formData.varietySelection.meat || ""}
                    onChange={(e) =>
                      handleInputChange("meat", e.target.value)
                    }
                    className="w-24"
                    min="0"
                    max={totalSandwiches}
                  />
                  <span className="ml-2 text-sm text-custom-gray">
                    sandwiches
                  </span>
                  {selectedTypes.meat &&
                    suggestedDistribution.meat > 0 && (
                      <span className="ml-2 text-sm text-blue-600">
                        (Suggested: {suggestedDistribution.meat})
                      </span>
                    )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <Label htmlFor="chicken" className="text-base font-bold">
              Chicken
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="chicken"
                checked={selectedTypes.chicken}
                onCheckedChange={(checked) =>
                  handleCheckChange("chicken", checked)
                }
              />
              <div className="flex-1">
                <div className="flex items-center mt-2">
                  <Input
                    type="number"
                    value={formData.varietySelection.chicken || ""}
                    onChange={(e) => handleInputChange("chicken", e.target.value)}
                    className="w-24"
                    min="0"
                    max={totalSandwiches}
                  />
                  <span className="ml-2 text-sm text-custom-gray">
                    sandwiches
                  </span>
                  {selectedTypes.chicken && suggestedDistribution.chicken > 0 && (
                    <span className="ml-2 text-sm text-blue-600">
                      (Suggested: {suggestedDistribution.chicken})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <Label htmlFor="fish" className="text-base font-bold">
              Fish
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fish"
                checked={selectedTypes.fish}
                onCheckedChange={(checked) =>
                  handleCheckChange("fish", checked)
                }
              />
              <div className="flex-1">
                <div className="flex items-center mt-2">
                  <Input
                    type="number"
                    value={formData.varietySelection.fish || ""}
                    onChange={(e) => handleInputChange("fish", e.target.value)}
                    className="w-24"
                    min="0"
                    max={totalSandwiches}
                  />
                  <span className="ml-2 text-sm text-custom-gray">
                    sandwiches
                  </span>
                  {selectedTypes.fish && suggestedDistribution.fish > 0 && (
                    <span className="ml-2 text-sm text-blue-600">
                      (Suggested: {suggestedDistribution.fish})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <Label htmlFor="veggie" className="text-base font-bold">
              Veggie
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="veggie"
                checked={selectedTypes.veggie}
                onCheckedChange={(checked) =>
                  handleCheckChange("veggie", checked)
                }
              />
              <div className="flex-1">
                <div className="flex items-center mt-2">
                  <Input
                    type="number"
                    value={formData.varietySelection.veggie || ""}
                    onChange={(e) => handleInputChange("veggie", e.target.value)}
                    className="w-24"
                    min="0"
                    max={totalSandwiches}
                  />
                  <span className="ml-2 text-sm text-custom-gray">
                    sandwiches
                  </span>
                  {selectedTypes.veggie && suggestedDistribution.veggie > 0 && (
                    <span className="ml-2 text-sm text-blue-600">
                      (Suggested: {suggestedDistribution.veggie})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <Label htmlFor="vegan" className="text-base font-bold">
              Vegan
            </Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="vegan"
                checked={selectedTypes.vegan}
                onCheckedChange={(checked) =>
                  handleCheckChange("vegan", checked)
                }
              />
              <div className="flex-1">
                <div className="flex items-center mt-2">
                  <Input
                    type="number"
                    value={formData.varietySelection.vegan || ""}
                    onChange={(e) => handleInputChange("vegan", e.target.value)}
                    className="w-24"
                    min="0"
                    max={totalSandwiches}
                  />
                  <span className="ml-2 text-sm text-custom-gray">
                    sandwiches
                  </span>
                  {selectedTypes.vegan && suggestedDistribution.vegan > 0 && (
                    <span className="ml-2 text-sm text-blue-600">
                      (Suggested: {suggestedDistribution.vegan})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`p-4 rounded-md ${
          currentTotal === totalSandwiches
            ? "bg-green-50"
            : currentTotal > totalSandwiches
              ? "bg-red-50"
              : "bg-blue-50"
        }`}
      >
        {currentTotal === totalSandwiches ? (
          <p className="text-green-700">
            Perfect! All {totalSandwiches} sandwiches are distributed
          </p>
        ) : currentTotal > totalSandwiches ? (
          <p className="text-red-700">
            You have {currentTotal - totalSandwiches} sandwiches too many.
            Please adjust the numbers.
          </p>
        ) : (
          <p className="text-blue-700">
            You still have {totalSandwiches - currentTotal} sandwiches to
            distribute
          </p>
        )}
      </div>


    </div>
  );
};

export default VarietySelector;
