"use client";
import React from "react";
import { FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import QuoteButton from "@/app/components/QuoteButton";
import { isDrink } from "@/lib/product-helpers";

// Helper function to render variety selection for both old and new formats
const renderVarietySelection = (varietySelection) => {
  if (!varietySelection || Object.keys(varietySelection).length === 0) {
    return null;
  }

  const categoryLabels = {
    sandwiches: "Sandwiches",
    salads: "Salads",
    bowls: "Bowls"
  };

  const subCategoryLabels = {
    meat: "Meat",
    chicken: "Chicken",
    fish: "Fish",
    veggie: "Vegetarian",
    vegan: "Vegan"
  };

  // Check if it's the new hierarchical format (contains hyphens)
  const hasHierarchicalFormat = Object.keys(varietySelection).some(key => key.includes('-'));

  if (hasHierarchicalFormat) {
    // New format: group by main category
    const categoryGroups = {};

    Object.entries(varietySelection).forEach(([key, quantity]) => {
      if (quantity > 0) {
        if (key.includes('-')) {
          const [mainCategory, subCategory] = key.split('-');
          if (!categoryGroups[mainCategory]) {
            categoryGroups[mainCategory] = [];
          }
          categoryGroups[mainCategory].push({
            subCategory,
            quantity
          });
        } else {
          // Backward compatibility: treat as sandwiches
          if (!categoryGroups.sandwiches) {
            categoryGroups.sandwiches = [];
          }
          categoryGroups.sandwiches.push({
            subCategory: key,
            quantity
          });
        }
      }
    });

    return Object.entries(categoryGroups).map(([mainCategory, items]) => {
      const categoryLabel = categoryLabels[mainCategory] || mainCategory;

      return (
        <div key={mainCategory} className="space-y-2">
          <div className="font-medium text-gray-700 text-sm">{categoryLabel}:</div>
          {items.map(({ subCategory, quantity }) => {
            const subLabel = subCategoryLabels[subCategory] || subCategory;
            return (
              <div key={`${mainCategory}-${subCategory}`} className="flex justify-between pl-4">
                <span className="text-gray-600">{subLabel}</span>
                <span>{quantity} items</span>
              </div>
            );
          })}
        </div>
      );
    });
  } else {
    // Old format: direct subcategory mapping (backward compatibility)
    return Object.entries(varietySelection)
      .filter(([_, quantity]) => quantity > 0)
      .map(([key, quantity]) => {
        const label = subCategoryLabels[key] || key;
        return (
          <div key={key} className="flex justify-between">
            <span>{label}</span>
            <span>{quantity} sandwiches</span>
          </div>
        );
      });
  }
};

const OrderSummaryStep = ({
  formData,
  updateFormData,
  setCurrentStep,
  sandwichOptions,
  breadTypes,
  sauceTypes,
  toppingTypes,
  secondaryButtonClasses,
  totalAmount,
  pricing,
}) => {
  // Helper function to get price for a variety selection item
  const getVarietyPrice = (key) => {
    const parts = key.split('-');

    if (parts[0] === 'lunchboxes' && parts.length === 3) {
      // Lunchbox: price by box type
      const boxType = parts[1];
      const lunchboxCategory = pricing?.categoryPricing?.find(cat => cat.typeCategory === 'lunchboxes');
      const boxTypeData = lunchboxCategory?.boxTypes?.find(bt => bt.boxType === boxType);
      return boxTypeData?.price || 0;
    } else if (parts.length === 2) {
      // Sandwiches/Salads: price by subcategory
      const [typeCategory, subCategory] = parts;
      const categoryData = pricing?.categoryPricing?.find(cat => cat.typeCategory === typeCategory);
      const subCatData = categoryData?.subCategoryPricing?.find(sc => sc.subCategory === subCategory);
      return subCatData?.price || 0;
    }

    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 items-center text-lg font-medium text-gray-700">
        <FileText className="w-5 h-5" />
        <h2 className="text-gray-700">Order summary</h2>
      </div>

      <div className="space-y-4">
        <div className="p-6 space-y-4 rounded-lg bg-custom-gray/10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Total number of items
              </p>
              <p className="text-lg font-medium">{formData.totalSandwiches}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type of order</p>
              <p className="text-lg font-medium">
                {formData.selectionType === "custom"
                  ? "Create your own selection"
                  : "Variety offer"}
              </p>
            </div>
          </div>

          {formData.selectionType === "custom" ? (
            <div className="pt-4 mt-4 border-t">
              <p className="mb-2 text-sm text-gray-500">Selected sandwiches</p>
              <div className="space-y-4">
                {Object.entries(formData.customSelection)
                  .filter(([_, selections]) => selections?.length > 0)
                  .map(([id, selections]) => {
                    const sandwich = sandwichOptions.find((s) => s._id === id);
                    return (
                      <div key={id} className="space-y-2">
                        <div className="font-medium text-gray-900">
                          {sandwich?.name || "Onbekend broodje"}
                        </div>
                        {selections.map((selection, index) => {
                          const breadType = breadTypes.find(
                            (b) => b.slug === selection.breadType
                          )?.name;

                          return (
                            <div
                              key={index}
                              className="flex justify-between pl-4 text-sm"
                            >
                              <span className="text-gray-600">
                                {selection.quantity}x
                                {!isDrink(sandwich) &&
                                  breadType &&
                                  ` - ${breadType}`}
                                {selection.sauce !== "geen" &&
                                  ` with ${selection.sauce}`}
                                {selection.toppings &&
                                  selection.toppings.length > 0 &&
                                  ` with ${selection.toppings.join(", ")}`}
                              </span>
                              <span className="font-medium text-gray-900">
                                €{selection.subTotal.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
              </div>
              <div className="pt-4 mt-4 border-t">
                <div className="flex justify-between text-lg font-medium">
                  <span>Total amount</span>
                  <span>€{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-1 text-sm text-gray-500">
                  <span>Total number of items</span>
                  <span>{formData.totalSandwiches} items</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-4 mt-4 border-t">
              <p className="mb-2 text-sm text-gray-500">
                Distribution of items
              </p>
              <div className="space-y-3">
                {renderVarietySelection(formData.varietySelection)}

                {/* Detailed pricing breakdown */}
                {formData.varietySelection && Object.keys(formData.varietySelection).length > 0 && (
                  <div className="pt-3 mt-3 border-t">
                    <p className="mb-2 text-xs font-medium text-gray-600">Price Breakdown:</p>
                    {Object.entries(formData.varietySelection)
                      .filter(([_, quantity]) => quantity > 0)
                      .map(([key, quantity]) => {
                        const price = getVarietyPrice(key);
                        const total = price * quantity;
                        return (
                          <div key={key} className="flex justify-between text-xs text-gray-600">
                            <span>{key}</span>
                            <span>{quantity} × €{price.toFixed(2)} = €{total.toFixed(2)}</span>
                          </div>
                        );
                      })}
                  </div>
                )}

                <div className="pt-3 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total items</span>
                    <span>{formData.totalSandwiches} items</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>Variety subtotal</span>
                    <span>
                      €{Object.entries(formData.varietySelection || {})
                        .reduce((sum, [key, quantity]) => sum + (getVarietyPrice(key) * quantity), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              {/* Drinks section for variety selection */}
              {formData.addDrinks && (formData.drinks?.freshOrangeJuice > 0 || formData.drinks?.sodas > 0) && (
                <div className="pt-4 mt-4 border-t">
                  <p className="mb-2 text-sm text-gray-500">Drinks</p>
                  <div className="space-y-2">
                    {formData.drinks?.freshOrangeJuice > 0 && (
                      <div className="flex justify-between">
                        <span>Fresh Orange Juice</span>
                        <span>{formData.drinks.freshOrangeJuice}x €{(formData.drinks.freshOrangeJuice * (pricing?.drinks?.freshOrangeJuice || 3.35)).toFixed(2)}</span>
                      </div>
                    )}
                    {formData.drinks?.sodas > 0 && (
                      <div className="flex justify-between">
                        <span>Sodas</span>
                        <span>{formData.drinks.sodas}x €{(formData.drinks.sodas * (pricing?.drinks?.sodas || 2.35)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Desserts section for variety selection */}
              {formData.addDesserts && (formData.desserts?.desserts > 0 || formData.desserts?.cookies > 0) && (
                <div className="pt-4 mt-4 border-t">
                  <p className="mb-2 text-sm text-gray-500">Desserts</p>
                  <div className="space-y-2">
                    {formData.desserts?.desserts > 0 && (
                      <div className="flex justify-between">
                        <span>Desserts</span>
                        <span>{formData.desserts.desserts}x €{(formData.desserts.desserts * (pricing?.desserts?.desserts || 3.50)).toFixed(2)}</span>
                      </div>
                    )}
                    {formData.desserts?.cookies > 0 && (
                      <div className="flex justify-between">
                        <span>Cookies</span>
                        <span>{formData.desserts.cookies}x €{(formData.desserts.cookies * (pricing?.desserts?.cookies || 2.50)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="pt-4 mt-4 border-t">
                <div className="flex justify-between text-lg font-medium">
                  <span>Total amount</span>
                  <span>€{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-1 text-sm text-gray-500">
                  <span>Total number of items</span>
                  <span>{formData.totalSandwiches} items</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="allergies" className="text-base">
            Allergies or comments?
          </Label>
          <Textarea
            placeholder="Add allergies or comments"
            className="mt-2"
            value={formData.allergies}
            onChange={(e) => updateFormData("allergies", e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="pt-4 mt-4 w-full">
            <QuoteButton
              formData={formData}
              sandwichOptions={sandwichOptions}
              buttonClasses={secondaryButtonClasses}
              pricing={pricing}
            />
          </div>
          <div className="pt-4 mt-4 w-full">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-2 py-2 w-full font-medium text-gray-700 rounded-md bg-custom-gray/10 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Update order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryStep; 