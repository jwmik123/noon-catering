import React, { useState } from "react";
import { Plus } from "lucide-react";
import SelectionModal from "./SelectionModal";
import { isDrink, calculateRemainingQuantity } from "@/lib/product-helpers";

const SelectionManager = ({
  sandwich,
  formData,
  updateFormData,
  totalAllowed,
  breadTypes,
  sauceTypes,
  toppingTypes,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const sandwichId = sandwich._id;
  const currentSelections = formData.customSelection[sandwichId] || [];

  // Only calculate remaining quantity for non-drinks
  const remainingQuantity = isDrink(sandwich)
    ? 999 // arbitrary high number for drinks
    : calculateRemainingQuantity(formData, totalAllowed);

  const handleAddSelection = (newSelection) => {
    const updatedSelections = [...currentSelections, newSelection];
    updateFormData("customSelection", {
      ...formData.customSelection,
      [sandwichId]: updatedSelections,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={!isDrink(sandwich) && remainingQuantity === 0}
        aria-label={`${sandwich.name} toevoegen`}
        className="flex h-10 items-center gap-1 rounded-[10px] bg-blush px-3 text-[13px] font-semibold text-noon transition-colors hover:bg-noon hover:text-cream disabled:opacity-40 disabled:hover:bg-blush disabled:hover:text-noon"
      >
        <Plus className="h-4 w-4" strokeWidth={2.4} />
        Toevoegen
      </button>
      {/* Mounted per opening, so every popup starts from the default options */}
      {isModalOpen && (
        <SelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          sandwich={sandwich}
          onAdd={handleAddSelection}
          remainingQuantity={remainingQuantity}
          breadTypes={breadTypes}
          sauceTypes={sauceTypes}
          toppingTypes={toppingTypes}
        />
      )}
    </>
  );
};

export default SelectionManager;
