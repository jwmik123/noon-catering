import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { HelpCircle, ChevronDown, ChevronRight } from "lucide-react";

const VarietySelector = ({ totalSandwiches, formData, updateFormData, pricing }) => {
  const [selectedMainCategories, setSelectedMainCategories] = useState({});
  const [selectedCombinations, setSelectedCombinations] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  // For lunchboxes: track which box type is selected
  const [selectedBoxTypes, setSelectedBoxTypes] = useState({});

  // Get categories from pricing data
  const mainCategories = pricing?.categoryPricing?.filter(cat =>
    ['sandwiches', 'salads', 'lunchboxes'].includes(cat.typeCategory)
  ) || [];

  // Standard subcategories for sandwiches, salads, and lunchbox proteins
  const subCategories = [
    { value: "meat", label: "Meat" },
    { value: "chicken", label: "Chicken" },
    { value: "fish", label: "Fish" },
    { value: "veggie", label: "Veggie" },
    { value: "vegan", label: "Vegan" }
  ];

  // Initialize from existing form data ONCE on mount
  useEffect(() => {
    if (formData.varietySelection && Object.keys(formData.varietySelection).length > 0) {
      const newCombinations = {};
      const newMainCategories = {};
      const newBoxTypes = {};

      Object.entries(formData.varietySelection).forEach(([key, value]) => {
        if (value > 0) {
          // Parse the key to determine category
          const parts = key.split('-');

          if (parts[0] === 'lunchboxes' && parts.length === 3) {
            // Lunchbox format: lunchboxes-boxType-protein
            newCombinations[key] = value;
            newMainCategories.lunchboxes = true;
            newBoxTypes[parts[1]] = true; // Track selected box types
          } else if (parts.length === 2) {
            // Regular format: category-subcategory
            newCombinations[key] = value;
            newMainCategories[parts[0]] = true;
          }
        }
      });

      setSelectedCombinations(newCombinations);
      setSelectedMainCategories(newMainCategories);
      setSelectedBoxTypes(newBoxTypes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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

      // Clear box types if lunchboxes unchecked
      if (category === 'lunchboxes') {
        setSelectedBoxTypes({});
      }
    }
  };

  // Handle box type selection for lunchboxes
  const handleBoxTypeChange = (boxType, checked) => {
    const newBoxTypes = {
      ...selectedBoxTypes,
      [boxType]: checked,
    };
    setSelectedBoxTypes(newBoxTypes);

    if (!checked) {
      // Remove all combinations for this box type
      const newCombinations = { ...selectedCombinations };
      Object.keys(newCombinations).forEach(key => {
        if (key.startsWith(`lunchboxes-${boxType}-`)) {
          delete newCombinations[key];
        }
      });
      setSelectedCombinations(newCombinations);
      updateFormData("varietySelection", newCombinations);
    }
  };

  // Handle subcategory selection
  const handleSubCategoryChange = (mainCategory, subCategory, checked, boxType = null) => {
    const combinationKey = boxType
      ? `${mainCategory}-${boxType}-${subCategory}` // lunchboxes-daily-chicken
      : `${mainCategory}-${subCategory}`; // sandwiches-meat

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

    // Calculate total items from all combinations
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

  // Get category data from pricing
  const getCategoryData = (categoryValue) => {
    return mainCategories.find(cat => cat.typeCategory === categoryValue);
  };

  // Get price for a combination
  const getPrice = (mainCategory, subCategory, boxType = null) => {
    const categoryData = getCategoryData(mainCategory);
    if (!categoryData) return null;

    if (mainCategory === 'lunchboxes' && boxType) {
      // For lunchboxes, price is determined by box type
      const boxTypeData = categoryData.boxTypes?.find(bt => bt.boxType === boxType);
      return boxTypeData?.price;
    } else {
      // For sandwiches/salads, price is by subcategory
      const subCatData = categoryData.subCategoryPricing?.find(sc => sc.subCategory === subCategory);
      return subCatData?.price;
    }
  };

  if (!pricing) {
    return <div className="text-gray-500">Loading pricing...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="relative group">
        <div className="absolute top-0 right-0 p-2 transition-colors rounded-full hover:bg-blue-50">
          <HelpCircle className="w-5 h-5 text-blue-600" />
        </div>
        <div className="absolute right-0 z-10 invisible w-64 p-4 mt-2 transition-all duration-200 bg-white rounded-lg shadow-lg opacity-0 top-full group-hover:opacity-100 group-hover:visible">
          <p className="text-sm text-gray-700">
            Onze verrassing aanbod laat je verschillende soorten producten kiezen. Selecteer categorieën,
            dan kies je de hoeveelheid voor elke soort. Voor lunchboxes, selecteer eerst het box type,
            dan kies je de eiwitten voor het box type.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
          Stap 1: Kies je hoofdcategorieën, dan selecteer je de opties binnen elke categorie.
        </div>

        {mainCategories.map((categoryData) => {
          const mainCategory = categoryData.typeCategory;
          const isLunchbox = mainCategory === 'lunchboxes';

          return (
            <div key={mainCategory} className="border rounded-lg p-4">
              {/* Main Category Header */}
              <div className="flex items-center space-x-3 mb-2">
                <Checkbox
                  id={mainCategory}
                  checked={selectedMainCategories[mainCategory] || false}
                  onCheckedChange={(checked) =>
                    handleMainCategoryChange(mainCategory, checked)
                  }
                />
                <button
                  type="button"
                  onClick={() => toggleCategoryExpansion(mainCategory)}
                  className="flex items-center space-x-2 text-lg font-semibold text-gray-800 hover:text-blue-600"
                >
                  {expandedCategories[mainCategory] ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  <span className="capitalize">{mainCategory}</span>
                </button>
              </div>

              {/* Category Description */}
              {categoryData.description && (
                <p className="text-sm text-gray-600 mb-4 ml-9">{categoryData.description}</p>
              )}

              {/* Content - Show when main category is selected and expanded */}
              {selectedMainCategories[mainCategory] && expandedCategories[mainCategory] && (
                <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-4">
                  {isLunchbox ? (
                    // LUNCHBOX: Show box types, then proteins
                    <>
                      <div className="text-sm font-medium text-gray-700 mb-3">
                        Select Box Type(s):
                      </div>
                      {categoryData.boxTypes?.map((boxTypeData) => (
                        <div key={boxTypeData.boxType} className="space-y-3">
                          {/* Box Type Selection */}
                          <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-md">
                            <Checkbox
                              id={`${mainCategory}-${boxTypeData.boxType}`}
                              checked={selectedBoxTypes[boxTypeData.boxType] || false}
                              onCheckedChange={(checked) =>
                                handleBoxTypeChange(boxTypeData.boxType, checked)
                              }
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={`${mainCategory}-${boxTypeData.boxType}`}
                                className="font-medium text-base cursor-pointer"
                              >
                                {boxTypeData.displayName}
                              </Label>
                              {boxTypeData.description && (
                                <p className="text-xs text-gray-500 mt-1">{boxTypeData.description}</p>
                              )}
                            </div>
                            <div className="text-sm font-semibold text-gray-700">
                              €{boxTypeData.price?.toFixed(2)}
                            </div>
                          </div>

                          {/* Protein Options for this box type */}
                          {selectedBoxTypes[boxTypeData.boxType] && (
                            <div className="ml-8 space-y-2 border-l-2 border-blue-200 pl-4">
                              <div className="text-xs text-gray-600 mb-2">
                                Select proteins for {boxTypeData.displayName}:
                              </div>
                              {subCategories.map((subCategory) => {
                                const combinationKey = `${mainCategory}-${boxTypeData.boxType}-${subCategory.value}`;
                                const isSelected = combinationKey in selectedCombinations;
                                const quantity = selectedCombinations[combinationKey] || 0;

                                return (
                                  <div key={combinationKey} className="flex items-center space-x-4">
                                    <Checkbox
                                      id={combinationKey}
                                      checked={isSelected}
                                      onCheckedChange={(checked) =>
                                        handleSubCategoryChange(mainCategory, subCategory.value, checked, boxTypeData.boxType)
                                      }
                                    />
                                    <Label htmlFor={combinationKey} className="font-medium min-w-[80px] text-sm">
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
                                        <span className="text-sm text-gray-500">boxes</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    // SANDWICHES/SALADS: Show subcategories with prices
                    <>
                      {subCategories.map((subCategory) => {
                        const combinationKey = `${mainCategory}-${subCategory.value}`;
                        const isSelected = combinationKey in selectedCombinations;
                        const quantity = selectedCombinations[combinationKey] || 0;
                        const price = getPrice(mainCategory, subCategory.value);

                        return (
                          <div key={subCategory.value} className="flex items-center space-x-4">
                            <Checkbox
                              id={combinationKey}
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleSubCategoryChange(mainCategory, subCategory.value, checked)
                              }
                            />
                            <Label htmlFor={combinationKey} className="font-medium min-w-[80px]">
                              {subCategory.label}
                            </Label>
                            {price && (
                              <span className="text-sm text-gray-600">
                                €{price.toFixed(2)}/item
                              </span>
                            )}

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
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-4 rounded-md bg-blue-50">
        <p className="text-blue-700">
          Huidige selectie: <span className="font-semibold">{currentTotal} items</span>
        </p>
        <p className="text-sm text-blue-600 mt-1">
          Je kunt elke hoeveelheid selecteren die je wilt.
        </p>
      </div>
    </div>
  );
};

export default VarietySelector;
