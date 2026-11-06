import React, { useState } from "react";
import Image from "next/image";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, ChevronDown, Info, Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isDrink, isSandwich } from "@/lib/product-helpers";
import { cn } from "@/lib/utils";
import { productImageKey, productImageLoader } from "@/lib/sanity-image";
import { Chip, PrimaryButton, QuantityStepper, formatEuro } from "@/app/components/order/ui";

const SelectionModal = ({
  isOpen,
  onClose,
  sandwich,
  onAdd,
  breadTypes = [],
  toppingTypes = [],
}) => {
  const [quantity, setQuantity] = React.useState(1);
  // Start on bread without a surcharge, whatever the order in Sanity.
  const [breadType, setBreadType] = React.useState(
    (breadTypes.find((bread) => !bread.surcharge) || breadTypes[0])?.slug || ""
  );
  const [sauce, setSauce] = React.useState(
    sandwich?.sauceOptions?.[0]?.name || "geen"
  );
  const [selectedToppings, setSelectedToppings] = React.useState([]);
  const [showAllergyInfo, setShowAllergyInfo] = useState(false);

  const handleToppingChange = (toppingName, checked) => {
    if (checked) {
      setSelectedToppings((prev) => [...prev, toppingName]);
    } else {
      setSelectedToppings((prev) => prev.filter((t) => t !== toppingName));
    }
  };

  const amount = Math.max(1, parseInt(quantity) || 1);

  const handleSubmit = () => {
    onAdd({
      sandwichId: sandwich.id,
      quantity: amount,
      breadType: isSandwich(sandwich) ? breadType : null,
      // Kept with the order, so its documents don't change when bread is renamed
      breadName: isSandwich(sandwich)
        ? breadTypes.find((b) => b.slug === breadType)?.name || null
        : null,
      sauce,
      toppings: selectedToppings,
      subTotal: calculateSubTotal(
        sandwich.price,
        isSandwich(sandwich) ? breadType : null,
        amount,
        sauce,
        selectedToppings
      ),
    });
    onClose();
  };

  const calculateSubTotal = (
    basePrice,
    selectedBreadType,
    qty,
    selectedSauce,
    selectedToppings
  ) => {
    const breadSurcharge = selectedBreadType
      ? breadTypes.find((b) => b.slug === selectedBreadType)?.surcharge || 0
      : 0;

    // Add sauce cost if applicable
    let sauceCost = 0;
    if (sandwich?.hasSauceOptions && selectedSauce !== "geen") {
      const sauceOption = sandwich.sauceOptions?.find(
        (s) => s.name === selectedSauce
      );
      sauceCost = sauceOption?.price || 0;
    }

    // Add topping costs if applicable
    let toppingCost = 0;
    if (sandwich?.hasToppings && selectedToppings.length > 0) {
      selectedToppings.forEach((toppingName) => {
        const toppingOption = sandwich.toppingOptions?.find(
          (t) => t.topping?.name === toppingName
        );
        if (toppingOption?.topping?.price) {
          toppingCost += toppingOption.topping.price;
        }
      });
    }

    return (basePrice + breadSurcharge + sauceCost + toppingCost) * qty;
  };

  // Calculate additional costs from bread, sauce and toppings
  const getAdditionalCosts = () => {
    let additionalCost = 0;

    // Add bread surcharge if applicable
    if (isSandwich(sandwich) && breadType) {
      const breadSurcharge = breadTypes.find((b) => b.slug === breadType)?.surcharge || 0;
      additionalCost += breadSurcharge;
    }

    // Add sauce cost if applicable
    if (sandwich?.hasSauceOptions && sauce !== "geen") {
      const selectedSauce = sandwich.sauceOptions?.find(
        (s) => s.name === sauce
      );
      if (selectedSauce?.price) {
        additionalCost += selectedSauce.price;
      }
    }

    // Add topping costs if applicable
    if (sandwich?.hasToppings && selectedToppings.length > 0) {
      selectedToppings.forEach((toppingName) => {
        const toppingOption = sandwich.toppingOptions?.find(
          (t) => t.topping?.name === toppingName
        );
        if (toppingOption?.topping?.price) {
          additionalCost += toppingOption.topping.price;
        }
      });
    }

    return additionalCost;
  };

  const additionalCosts = getAdditionalCosts();
  const totalPerItem = (sandwich?.price || 0) + additionalCosts;
  const totalPrice = totalPerItem * amount;

  const selectedBread = breadTypes.find((b) => b.slug === breadType);
  const sauceSurcharge =
    sandwich?.hasSauceOptions && sauce !== "geen"
      ? sandwich.sauceOptions?.find((s) => s.name === sauce)?.price || 0
      : 0;
  const toppingSurcharge = selectedToppings.reduce(
    (total, toppingName) =>
      total +
      (sandwich.toppingOptions?.find((t) => t.topping?.name === toppingName)?.topping?.price || 0),
    0
  );
  const imageKey = productImageKey(sandwich?.image);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 flex items-end justify-center bg-noon-ink/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 sm:items-center sm:p-6">
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[18px] bg-cream text-noon shadow-[0_30px_60px_-30px_rgba(47,42,92,0.6)] outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-10 sm:max-h-[88vh] sm:w-[480px] sm:rounded-[14px] sm:data-[state=open]:slide-in-from-bottom-4"
          >
            <div className="overflow-y-auto">
              <div className="relative h-48 shrink-0 overflow-hidden bg-blush sm:h-60">
                {imageKey && (
                  <Image
                    loader={productImageLoader(sandwich.image, { aspect: 2 })}
                    src={imageKey}
                    alt={sandwich.name}
                    fill
                    sizes="(min-width: 640px) 480px, 100vw"
                    className="object-cover"
                  />
                )}
                <DialogPrimitive.Close
                  aria-label="Sluiten"
                  className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-cream/95 text-noon shadow-sm"
                >
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
              </div>

              <div className="flex flex-col gap-6 px-5 pb-6 pt-5 sm:px-7">
                <div className="flex flex-col gap-1.5">
                  <DialogPrimitive.Title className="m-0 font-display text-[26px] font-normal leading-[1.15] tracking-[0.02em] text-noon">
                    {sandwich?.name}
                  </DialogPrimitive.Title>
                  {sandwich?.description && (
                    <p className="m-0 text-sm leading-[1.5] text-mist">{sandwich.description}</p>
                  )}
                  <span className="text-base font-semibold">{formatEuro(sandwich?.price)}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold">Aantal</span>
                  <QuantityStepper
                    label={sandwich?.name}
                    value={quantity}
                    onChange={setQuantity}
                    min={1}
                    size="sm"
                  />
                </div>

                {/* Only show bread type selection for sandwiches */}
                {isSandwich(sandwich) && (
                  <fieldset role="radiogroup" className="m-0 flex flex-col gap-2 border-0 p-0">
                    <legend className="mb-2 p-0 text-sm font-semibold">Brood</legend>
                    {breadTypes.map((bread) => {
                      const active = breadType === bread.slug;
                      return (
                        <button
                          key={bread.slug}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setBreadType(bread.slug)}
                          className={cn(
                            "flex h-12 items-center gap-3 rounded-[10px] border px-4 text-left text-sm transition-colors",
                            active ? "border-noon bg-blush" : "border-noon/15 bg-paper hover:border-noon/40"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              active ? "border-noon bg-noon" : "border-noon/30"
                            )}
                          >
                            {active && <span className="h-2 w-2 rounded-full bg-cream" />}
                          </span>
                          <span className="flex-1 font-medium">{bread.name}</span>
                          <span className="tabular-nums text-mist">
                            {bread.surcharge > 0 ? `+${formatEuro(bread.surcharge)}` : "Inbegrepen"}
                          </span>
                        </button>
                      );
                    })}
                  </fieldset>
                )}

                {sandwich.hasSauceOptions && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="sauce" className="text-sm font-semibold">
                      Saus
                    </Label>
                    <Select value={sauce} onValueChange={setSauce}>
                      <SelectTrigger id="sauce">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="geen">Geen saus</SelectItem>
                        {sandwich?.sauceOptions?.map((sauceOption) => (
                          <SelectItem key={sauceOption.name} value={sauceOption.name}>
                            {sauceOption.name}
                            {sauceOption.price > 0 && ` (+${formatEuro(sauceOption.price)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {sandwich.hasToppings && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">
                      Toppings <span className="font-normal text-mist">· kies wat je wilt</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {sandwich?.toppingOptions?.map((toppingOption) => {
                        const topping = toppingOption.topping;
                        if (!topping) return null;
                        const active = selectedToppings.includes(topping.name);
                        return (
                          <Chip
                            key={topping._id}
                            active={active}
                            onClick={() => handleToppingChange(topping.name, !active)}
                            className="inline-flex items-center gap-1.5"
                          >
                            {active ? (
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            ) : (
                              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                            )}
                            {topping.name}
                            {topping.price > 0 && (
                              <span className="opacity-70">+{formatEuro(topping.price)}</span>
                            )}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="rounded-[10px] bg-blush/60 px-4 py-3 text-[13px]">
                  <button
                    type="button"
                    onClick={() => setShowAllergyInfo(!showAllergyInfo)}
                    aria-expanded={showAllergyInfo}
                    className="flex w-full items-center gap-2 font-semibold text-noon"
                  >
                    <Info className="h-4 w-4" />
                    Allergeneninformatie
                    <ChevronDown
                      className={cn("ml-auto h-4 w-4 transition-transform", showAllergyInfo && "rotate-180")}
                    />
                  </button>
                  {showAllergyInfo && (
                    <div className="mt-2 flex flex-col gap-2 text-mist">
                      {sandwich.allergyInfo?.length > 0 ? (
                        <p className="m-0">
                          Bevat of kan bevatten:{" "}
                          <span className="capitalize text-noon">{sandwich.allergyInfo.join(", ")}</span>
                        </p>
                      ) : (
                        <p className="m-0">Geen allergeneninformatie beschikbaar.</p>
                      )}
                      {sandwich.allergyNotes && <p className="m-0 italic">{sandwich.allergyNotes}</p>}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 border-t border-noon/10 pt-4 text-sm">
                  <div className="flex justify-between text-mist">
                    <span>Basisprijs</span>
                    <span className="tabular-nums">{formatEuro(sandwich?.price)}</span>
                  </div>
                  {!isDrink(sandwich) && selectedBread?.surcharge > 0 && (
                    <div className="flex justify-between text-mist">
                      <span>{selectedBread.name}</span>
                      <span className="tabular-nums">+{formatEuro(selectedBread.surcharge)}</span>
                    </div>
                  )}
                  {sandwich?.hasSauceOptions && sauce !== "geen" && (
                    <div className="flex justify-between text-mist">
                      <span>Saus</span>
                      <span className="tabular-nums">+{formatEuro(sauceSurcharge)}</span>
                    </div>
                  )}
                  {sandwich?.hasToppings && selectedToppings.length > 0 && (
                    <div className="flex justify-between text-mist">
                      <span>Toppings</span>
                      <span className="tabular-nums">+{formatEuro(toppingSurcharge)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-mist">
                    <span>Per stuk</span>
                    <span className="tabular-nums">{formatEuro(totalPerItem)}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between text-lg font-bold">
                    <span>Totaal ({amount}×)</span>
                    <span className="tabular-nums">{formatEuro(totalPrice)}</span>
                  </div>
                  <span className="text-xs text-mist">Prijzen excl. btw</span>
                </div>
              </div>
            </div>

            <div className="border-t border-noon/10 bg-cream px-5 pb-5 pt-4 sm:px-7">
              <PrimaryButton onClick={handleSubmit} className="w-full">
                Voeg toe aan bestelling
              </PrimaryButton>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Overlay>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default SelectionModal;
