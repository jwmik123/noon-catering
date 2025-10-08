import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { HelpCircle, ChevronDown, ChevronRight } from "lucide-react";

const VarietySelector = ({ totalSandwiches, formData, updateFormData }) => {
  // Main categories from Sanity
  const mainCategories = [
    { value: "sandwiches", label: "Sandwiches" },
    { value: "salads", label: "Salads" },
    { value: "bowls", label: "Bowls" }
  ];

  // Sub categories from Sanity
  const subCategories = [
    { value: "meat", label: "Meat" },
    { value: "chicken", label: "Chicken" },
    { value: "fish", label: "Fish" },
    { value: "veggie", label: "Veggie" },
    { value: "vegan", label: "Vegan" }
  ];

  const [selectedMainCategories, setSelectedMainCategories] = useState({});
  const [selectedCombinations, setSelectedCombinations] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  // Initialize from existing form data
  useEffect(() => {
    if (formData.varietySelection) {
      // Convert old format to new hierarchical format
      const newCombinations = {};
      const newMainCategories = {};

      Object.entries(formData.varietySelection).forEach(([key, value]) => {
        if (value > 0) {
          // Default to sandwiches for backward compatibility
          const combinationKey = `sandwiches-${key}`;
          newCombinations[combinationKey] = value;
          newMainCategories.sandwiches = true;
        }
      });

      setSelectedCombinations(newCombinations);
      setSelectedMainCategories(newMainCategories);
    }
  }, []);

  // Handle main category selection
  const handleMainCategoryChange = (category, checked) => {
    const newSelectedMain = {
      ...selectedMainCategories,
      [category]: checked,
    };
    setSelectedMainCategories(newSelectedMain);

    if (checked) {
      setExpandedCategories(prev => ({ ...prev, [category]: true }));
    } else {
      // Remove all combinations for this main category
      const newCombinations = { ...selectedCombinations };
      Object.keys(newCombinations).forEach(key => {
        if (key.startsWith(`${category}-`)) {
          delete newCombinations[key];
        }
      });
      setSelectedCombinations(newCombinations);
      updateFormData("varietySelection", newCombinations);
    }
  };

  // Handle subcategory selection
  const handleSubCategoryChange = (mainCategory, subCategory, checked) => {
    const combinationKey = `${mainCategory}-${subCategory}`;
    const newCombinations = { ...selectedCombinations };

    if (checked) {
      newCombinations[combinationKey] = 0; // Start with 0, user will set quantity
    } else {
      delete newCombinations[combinationKey];
    }

    setSelectedCombinations(newCombinations);
    updateFormData("varietySelection", newCombinations);
  };

  // Handle quantity input
  const handleQuantityChange = (combinationKey, value) => {
    const numValue = value === "" ? 0 : Math.max(0, parseInt(value) || 0);
    const newCombinations = {
      ...selectedCombinations,
      [combinationKey]: numValue,
    };
    setSelectedCombinations(newCombinations);

    // Calculate total sandwiches from all combinations
    const newTotal = Object.values(newCombinations).reduce((sum, val) => sum + (val || 0), 0);

    // Update both varietySelection and totalSandwiches
    updateFormData("varietySelection", newCombinations);
    updateFormData("totalSandwiches", newTotal);
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const currentTotal = Object.values(selectedCombinations).reduce(
    (sum, val) => sum + (val || 0),
    0
  );

  // Generate suggestions
  const generateSuggestion = (mainCategory) => {
    const selectedSubs = Object.keys(selectedCombinations).filter(key =>
      key.startsWith(`${mainCategory}-`)
    );

    if (selectedSubs.length === 0) return {};

    const portionSize = Math.floor(totalSandwiches / selectedSubs.length);
    const remainder = totalSandwiches % selectedSubs.length;

    const suggestion = {};
    selectedSubs.forEach((key, index) => {
      suggestion[key] = portionSize + (index < remainder ? 1 : 0);
    });

    return suggestion;
  };

  return (
    <div className="space-y-6">
      <div className="relative group">
        <div className="absolute top-0 right-0 p-2 transition-colors rounded-full hover:bg-blue-50">
          <HelpCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div className="absolute right-0 z-10 invisible w-64 p-4 mt-2 transition-all duration-200 bg-white rounded-lg shadow-lg opacity-0 top-full group-hover:opacity-100 group-hover:visible">
          <p className="text-sm text-gray-700">
            Our variety offer lets you choose different types of products and their subcategories.
            First select the main categories (Sandwiches, Salads, Bowls), then choose the specific
            types within each category.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          Step 1: Choose your main categories, then select subcategories within each.
        </div>

        {mainCategories.map((mainCategory) => (
          <div key={mainCategory.value} className="border rounded-lg p-4">
            {/* Main Category Header */}
            <div className="flex items-center space-x-3 mb-4">
              <Checkbox
                id={mainCategory.value}
                checked={selectedMainCategories[mainCategory.value] || false}
                onCheckedChange={(checked) =>
                  handleMainCategoryChange(mainCategory.value, checked)
                }
              />
              <button
                type="button"
                onClick={() => toggleCategoryExpansion(mainCategory.value)}
                className="flex items-center space-x-2 text-lg font-semibold text-gray-800 hover:text-blue-600"
              >
                {expandedCategories[mainCategory.value] ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
                <span>{mainCategory.label}</span>
              </button>
            </div>

            {/* Subcategories - Show when main category is selected and expanded */}
            {selectedMainCategories[mainCategory.value] && expandedCategories[mainCategory.value] && (
              <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                {subCategories.map((subCategory) => {
                  const combinationKey = `${mainCategory.value}-${subCategory.value}`;
                  const isSelected = combinationKey in selectedCombinations;
                  const quantity = selectedCombinations[combinationKey] || 0;

                  return (
                    <div key={subCategory.value} className="flex items-center space-x-4">
                      <Checkbox
                        id={combinationKey}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          handleSubCategoryChange(mainCategory.value, subCategory.value, checked)
                        }
                      />
                      <Label htmlFor={combinationKey} className="font-medium min-w-[80px]">
                        {subCategory.label}
                      </Label>

                      {isSelected && (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={quantity || ""}
                            onChange={(e) => handleQuantityChange(combinationKey, e.target.value)}
                            className="w-20"
                            min="0"
                            placeholder="0"
                          />
                          <span className="text-sm text-gray-500">items</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 rounded-md bg-blue-50">
        <p className="text-blue-700">
          Current selection: <span className="font-semibold">{currentTotal} items</span>
        </p>
        <p className="text-sm text-blue-600 mt-1">
          You can select any quantity you want
        </p>
      </div>
    </div>
  );
};

export default VarietySelector;
