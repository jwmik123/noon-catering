import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { EXTRA_GROUPS } from "@/app/assets/extras";
import { Card, Chip, QuantityStepper, formatEuro } from "@/app/components/order/ui";
import { cn } from "@/lib/utils";

// Kinds of filling, each with its own tint in the distribution bar. Tints of
// purple only: salmon never sits next to the purple.
const KINDS = [
  { value: "vlees", label: "Vlees", color: "#524A98", ink: "#FFFFFF" },
  { value: "kip", label: "Kip", color: "#7A73B5", ink: "#FFFFFF" },
  { value: "vis", label: "Vis", color: "#928CC4", ink: "#FFFFFF" },
  { value: "veggie", label: "Veggie", color: "#B9B4DA", ink: "#2F2A5C" },
  { value: "vegan", label: "Vegan", color: "#DCD9EC", ink: "#2F2A5C" },
];

// Kinds not offered per main category
const EXCLUDED_KINDS = {
  sandwiches: ["vis"],
  salades: ["vlees", "vis"],
};

const kindsFor = (category) =>
  KINDS.filter((kind) => !EXCLUDED_KINDS[category]?.includes(kind.value));

// Shares of the sandwiches; salads and lunchboxes are always picked by hand.
const MIXES = [
  { id: "balanced", label: "Gebalanceerd", ratios: { vlees: 0.3, kip: 0.3, veggie: 0.25, vegan: 0.15 } },
  { id: "greener", label: "Meer veggie", ratios: { vlees: 0.15, kip: 0.15, veggie: 0.4, vegan: 0.3 } },
  { id: "meatFree", label: "Vleesvrij", ratios: { veggie: 0.6, vegan: 0.4 } },
];

const CATEGORY_LABELS = { salades: "Salades", lunchboxes: "Lunchboxes" };

const sumValues = (selection) =>
  Object.values(selection).reduce((sum, quantity) => sum + (quantity || 0), 0);

// Spread the people not covered by salads or lunchboxes over the sandwiches.
const splitMix = (mixId, people, selection) => {
  const mix = MIXES.find((m) => m.id === mixId);
  const next = Object.fromEntries(
    Object.entries(selection).filter(([key]) => !key.startsWith("sandwiches-"))
  );
  const rest = Math.max(0, people - sumValues(next));
  const kinds = Object.keys(mix.ratios);
  let spread = 0;

  kinds.forEach((kind) => {
    const quantity = Math.round(rest * mix.ratios[kind]);
    spread += quantity;
    if (quantity > 0) next[`sandwiches-${kind}`] = quantity;
  });

  // Rounding differences go to the largest share
  const largest = kinds.reduce((a, b) => (mix.ratios[b] > mix.ratios[a] ? b : a));
  const key = `sandwiches-${largest}`;
  const corrected = (next[key] || 0) + rest - spread;
  if (corrected > 0) next[key] = corrected;
  else delete next[key];

  return next;
};

const DistributionBar = ({ selection, target }) => {
  const totals = KINDS.map((kind) => ({
    ...kind,
    quantity: Object.entries(selection).reduce(
      (sum, [key, quantity]) => (key.split("-").pop() === kind.value ? sum + (quantity || 0) : sum),
      0
    ),
  })).filter((kind) => kind.quantity > 0);
  const scale = Math.max(target, totals.reduce((sum, kind) => sum + kind.quantity, 0)) || 1;

  return (
    <div className="flex h-11 gap-0.5 overflow-hidden rounded-[10px] bg-blush/50">
      {totals.map((kind) => {
        const share = (kind.quantity / scale) * 100;
        return (
          <div
            key={kind.value}
            title={`${kind.label}: ${kind.quantity}`}
            className="flex min-w-0 items-center justify-center overflow-hidden whitespace-nowrap text-xs font-semibold transition-[width] duration-500"
            style={{ width: `${share}%`, backgroundColor: kind.color, color: kind.ink }}
          >
            {share >= 20 ? `${kind.label} ${kind.quantity}` : share >= 5 ? kind.quantity : null}
          </div>
        );
      })}
    </div>
  );
};

const KindRow = ({ id, kind, price, selection, onQuantity }) => (
  <div className="flex items-center gap-3">
    <span className="h-3 w-3 shrink-0 rounded-[4px]" style={{ backgroundColor: kind.color }} aria-hidden />
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-semibold text-noon">{kind.label}</span>
      {price > 0 && <span className="block text-xs text-mist">{formatEuro(price)} per stuk</span>}
    </span>
    <QuantityStepper
      label={kind.label}
      size="sm"
      value={selection[id] || 0}
      onChange={(value) => onQuantity(id, value)}
    />
  </div>
);

const MoreOptions = ({ title, count, description, children }) => {
  const [open, setOpen] = useState(count > 0);

  return (
    <Card className="p-4 md:p-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left text-[15px] font-semibold text-noon"
      >
        <span>
          {title}
          {count > 0 && <span className="ml-2 text-[13px] font-normal text-mist">{count} gekozen</span>}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-mist transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-4 flex flex-col gap-4 border-t border-noon/10 pt-4">
          {description && <p className="m-0 text-[13px] leading-[1.5] text-mist">{description}</p>}
          {children}
        </div>
      )}
    </Card>
  );
};

const VarietySelector = ({ formData, updateFormData, pricing }) => {
  const selection = formData.varietySelection || {};
  const people = formData.numberOfPeople || 0;
  const hasExtras = EXTRA_GROUPS.some((group) =>
    Object.values(formData[group.id] || {}).some((quantity) => quantity > 0)
  );
  const startFromMix = sumValues(selection) === 0 && !hasExtras;
  const [mix, setMix] = useState(startFromMix ? "balanced" : "custom");

  // Start from a balanced mix the first time this screen opens.
  useEffect(() => {
    if (startFromMix && people >= 3) {
      updateFormData("varietySelection", splitMix("balanced", people, selection));
    }
    // Only on first render: later changes are the customer's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pricing) {
    return <div className="text-mist">Prijzen laden...</div>;
  }

  const categories = pricing.categoryPricing || [];
  const sandwiches = categories.find((cat) => cat.typeCategory === "sandwiches");
  const otherCategories = categories.filter((cat) =>
    ["salades", "lunchboxes"].includes(cat.typeCategory)
  );

  const applyMix = (mixId) => {
    setMix(mixId);
    updateFormData("varietySelection", splitMix(mixId, people, selection));
  };

  const changePeople = (value) => {
    const next = parseInt(value) || 0;
    updateFormData("numberOfPeople", next);
    if (mix !== "custom" && next >= 3) {
      updateFormData("varietySelection", splitMix(mix, next, selection));
    }
  };

  const changeQuantity = (key, value) => {
    const quantity = Math.max(0, Number(value) || 0);
    const next = { ...selection };
    if (quantity > 0) next[key] = quantity;
    else delete next[key];
    setMix("custom");
    updateFormData("varietySelection", next);
  };

  const clearSelection = () => {
    setMix("custom");
    updateFormData("varietySelection", {});
  };

  const priceOf = (key) => {
    const [category, second] = key.split("-");
    const categoryData = categories.find((cat) => cat.typeCategory === category);
    if (category === "lunchboxes") {
      return categoryData?.boxTypes?.find((box) => box.boxType === second)?.price || 0;
    }
    return categoryData?.subCategoryPricing?.find((sub) => sub.subCategory === second)?.price || 0;
  };
  const subPrice = (category, kind) => priceOf(`${category}-${kind}`);

  const distributed = sumValues(selection);
  const mixPrice = Object.entries(selection).reduce(
    (sum, [key, quantity]) => sum + priceOf(key) * (quantity || 0),
    0
  );
  const countFor = (category) =>
    sumValues(Object.fromEntries(Object.entries(selection).filter(([key]) => key.startsWith(`${category}-`))));

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-5 p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[15px] font-semibold text-noon">Aantal personen</span>
          <QuantityStepper
            label="personen"
            size="sm"
            value={formData.numberOfPeople || ""}
            onChange={changePeople}
            min={3}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {MIXES.map((option) => (
            <Chip key={option.id} active={mix === option.id} onClick={() => applyMix(option.id)}>
              {option.label}
            </Chip>
          ))}
          {mix === "custom" && distributed > 0 && <Chip active>Aangepast</Chip>}
        </div>

        <div className="flex flex-col gap-2">
          <DistributionBar selection={selection} target={people} />
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
            <span className={distributed < people ? "font-semibold text-noon" : "text-mist"}>
              {distributed === people
                ? `Alle ${people} items verdeeld`
                : distributed < people
                  ? `Nog ${people - distributed} te verdelen`
                  : `${distributed - people} meer dan je aantal personen`}
            </span>
            <span className="font-semibold tabular-nums text-noon">
              {formatEuro(mixPrice)} <span className="text-xs font-normal text-mist">excl. btw</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-noon/10 pt-5">
          {kindsFor("sandwiches").map((kind) => (
            <KindRow
              key={kind.value}
              id={`sandwiches-${kind.value}`}
              kind={kind}
              price={subPrice("sandwiches", kind.value)}
              selection={selection}
              onQuantity={changeQuantity}
            />
          ))}
        </div>

        {sandwiches?.description && (
          <p className="m-0 text-[13px] leading-[1.5] text-mist">{sandwiches.description}</p>
        )}
      </Card>

      {otherCategories.map((categoryData) => {
        const category = categoryData.typeCategory;
        return (
          <MoreOptions
            key={category}
            title={CATEGORY_LABELS[category]}
            count={countFor(category)}
            description={categoryData.description}
          >
            {category === "lunchboxes"
              ? categoryData.boxTypes?.map((box) => (
                  <div key={box.boxType} className="flex flex-col gap-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-semibold text-noon">{box.displayName}</span>
                      <span className="text-xs text-mist">{formatEuro(box.price)} per stuk</span>
                    </div>
                    {box.description && <p className="m-0 text-xs text-mist">{box.description}</p>}
                    {kindsFor(category).map((kind) => (
                      <KindRow
                        key={kind.value}
                        id={`lunchboxes-${box.boxType}-${kind.value}`}
                        kind={kind}
                        selection={selection}
                        onQuantity={changeQuantity}
                      />
                    ))}
                  </div>
                ))
              : kindsFor(category).map((kind) => (
                  <KindRow
                    key={kind.value}
                    id={`${category}-${kind.value}`}
                    kind={kind}
                    price={subPrice(category, kind.value)}
                    selection={selection}
                    onQuantity={changeQuantity}
                  />
                ))}
          </MoreOptions>
        );
      })}

      {distributed > 0 && (
        <button
          type="button"
          onClick={clearSelection}
          className="self-start text-[13px] text-mist underline underline-offset-2 hover:text-noon"
        >
          Alleen extra&apos;s bestellen? Maak de verdeling leeg
        </button>
      )}
    </div>
  );
};

export default VarietySelector;
