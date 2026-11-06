"use client";
import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import QuoteButton from "@/app/components/QuoteButton";
import { EXTRA_GROUPS, extraPrice } from "@/app/assets/extras";
import { Card, Heading, OptionCard, SecondaryButton, formatEuro } from "@/app/components/order/ui";
import { isDrink } from "@/lib/product-helpers";

const CATEGORY_LABELS = {
  sandwiches: "Broodjes",
  salades: "Salades",
  salads: "Salades",
  lunchboxes: "Lunchboxes",
  bowls: "Bowls",
};

const SUBCATEGORY_LABELS = {
  vlees: "vlees",
  meat: "vlees",
  kip: "kip",
  chicken: "kip",
  vis: "vis",
  fish: "vis",
  veggie: "veggie",
  vegan: "vegan",
};

// "sandwiches-kip" -> "Broodjes · kip", also for lunchboxes and the old format
const varietyLabel = (key) => {
  const parts = key.split("-");
  const sub = (value) => SUBCATEGORY_LABELS[value] || value;
  if (parts.length === 1) return `Broodjes · ${sub(parts[0])}`;
  const category = CATEGORY_LABELS[parts[0]] || parts[0];
  return parts.length === 3
    ? `${category} · ${parts[1]} · ${sub(parts[2])}`
    : `${category} · ${sub(parts[1])}`;
};

const Line = ({ label, detail, amount }) => (
  <div className="flex items-baseline justify-between gap-4 text-sm">
    <span className="min-w-0">
      <span className="text-noon">{label}</span>
      {detail && <span className="block text-xs leading-[1.4] text-mist">{detail}</span>}
    </span>
    <span className="shrink-0 tabular-nums text-noon">{amount}</span>
  </div>
);

const OrderSummaryStep = ({
  formData,
  updateFormData,
  setCurrentStep,
  sandwichOptions,
  breadTypes,
  sauceTypes,
  toppingTypes,
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

  // Extras-only orders (e.g. dessert buffet) have no sandwiches: count the extras instead
  const extrasCount = [
    formData.addDrinks && formData.drinks,
    formData.addSoup && formData.soup,
    formData.addDesserts && formData.desserts,
  ].reduce(
    (sum, group) =>
      sum + Object.values(group || {}).reduce((t, qty) => t + (Number(qty) || 0), 0),
    0
  );
  const displayItemCount =
    formData.selectionType === "variety" && !(formData.totalSandwiches > 0)
      ? extrasCount
      : formData.totalSandwiches;

  const activeExtras = EXTRA_GROUPS.filter((group) => formData[group.flag]).flatMap((group) =>
    group.items
      .filter((item) => formData[group.id]?.[item.key] > 0)
      .map((item) => ({ group, item, quantity: formData[group.id][item.key] }))
  );

  return (
    <div className="flex flex-col gap-8">
      <Heading title="Bestelsamenvatting" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="flex flex-col gap-5 self-start p-5 md:p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="eyebrow m-0 text-mist">Aantal items</p>
              <p className="m-0 mt-1 text-lg font-semibold text-noon">{displayItemCount}</p>
            </div>
            <div>
              <p className="eyebrow m-0 text-mist">Type bestelling</p>
              <p className="m-0 mt-1 text-lg font-semibold text-noon">
                {formData.selectionType === "custom" ? "Eigen selectie" : "Verrassing aanbod"}
              </p>
            </div>
          </div>

          {formData.selectionType === "custom" ? (
            <div className="flex flex-col gap-4 border-t border-noon/10 pt-5">
              {Object.entries(formData.customSelection)
                .filter(([_, selections]) => selections?.length > 0)
                .map(([id, selections]) => {
                  const sandwich = sandwichOptions.find((s) => s._id === id);
                  return (
                    <div key={id} className="flex flex-col gap-1.5">
                      <p className="m-0 text-sm font-semibold text-noon">
                        {sandwich?.name || "Onbekend broodje"}
                      </p>
                      {selections.map((selection, index) => {
                        const breadType = breadTypes.find(
                          (b) => b.slug === selection.breadType
                        )?.name;

                        return (
                          <Line
                            key={index}
                            label={
                              <span className="text-mist">
                                {selection.quantity}x
                                {!isDrink(sandwich) && breadType && ` - ${breadType}`}
                                {selection.sauce !== "geen" && ` met ${selection.sauce}`}
                                {selection.toppings?.length > 0 &&
                                  ` met ${selection.toppings.join(", ")}`}
                              </span>
                            }
                            amount={formatEuro(selection.subTotal)}
                          />
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          ) : (
            formData.totalSandwiches > 0 && (
              <div className="flex flex-col gap-2 border-t border-noon/10 pt-5">
                <p className="eyebrow m-0 text-mist">Verdeling van items</p>
                {Object.entries(formData.varietySelection || {})
                  .filter(([_, quantity]) => quantity > 0)
                  .map(([key, quantity]) => {
                    const price = getVarietyPrice(key);
                    return (
                      <Line
                        key={key}
                        label={varietyLabel(key)}
                        detail={price > 0 ? `${quantity} × ${formatEuro(price)}` : `${quantity} items`}
                        amount={formatEuro(price * quantity)}
                      />
                    );
                  })}
              </div>
            )
          )}

          {formData.selectionType !== "custom" && activeExtras.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-noon/10 pt-5">
              <p className="eyebrow m-0 text-mist">Extra&apos;s</p>
              {activeExtras.map(({ group, item, quantity }) => (
                <Line
                  key={item.key}
                  label={item.label}
                  detail={`${quantity} × ${formatEuro(extraPrice(pricing, group, item))}`}
                  amount={formatEuro(quantity * extraPrice(pricing, group, item))}
                />
              ))}
            </div>
          )}

          <div className="flex items-baseline justify-between border-t border-noon/10 pt-5">
            <span className="text-[15px] font-semibold text-noon">
              Totaal bedrag <span className="text-xs font-normal text-mist">excl. btw</span>
            </span>
            <span className="text-xl font-bold tabular-nums text-noon">{formatEuro(totalAmount)}</span>
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <span className="text-[15px] font-semibold text-noon">Kies je verpakking</span>
            <div role="radiogroup" aria-label="Verpakking" className="flex flex-col gap-2">
              <OptionCard
                active={(formData.packagingType || "individual") === "individual"}
                title="Individueel verpakt"
                onClick={() => updateFormData("packagingType", "individual")}
              />
              <OptionCard
                active={formData.packagingType === "plateau"}
                title="Op plateau"
                subtitle="Door twee gesneden en feestelijk verpakt op plateau"
                onClick={() => updateFormData("packagingType", "plateau")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Label htmlFor="allergies" className="text-[15px] font-semibold text-noon">
              Allergieën of opmerkingen?
            </Label>
            <Textarea
              id="allergies"
              placeholder="Voeg allergieën of opmerkingen toe"
              value={formData.allergies}
              onChange={(e) => updateFormData("allergies", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <QuoteButton
              formData={formData}
              sandwichOptions={sandwichOptions}
              pricing={pricing}
            />
            <SecondaryButton onClick={() => setCurrentStep(2)}>Bestelling bijwerken</SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryStep; 