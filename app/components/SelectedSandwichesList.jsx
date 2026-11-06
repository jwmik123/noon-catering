import { X } from "lucide-react";
import { isDrink } from "@/lib/product-helpers";
import { Card, ProgressBar, formatEuro } from "@/app/components/order/ui";

const SelectedSandwichesList = ({
  selections,
  sandwichOptions,
  onRemove,
  breadTypes,
  target = 0,
}) => {
  // Group selections by sandwich
  const groupedSelections = Object.entries(selections)
    .map(([sandwichId, sandwichSelections]) => {
      const sandwich = sandwichOptions.find((s) => s._id === sandwichId);
      return {
        sandwich,
        selections: sandwichSelections,
      };
    })
    .filter((group) => group.sandwich && group.selections.length > 0);

  const allSelections = groupedSelections.flatMap((group) => group.selections);
  const count = allSelections.reduce((total, selection) => total + selection.quantity, 0);
  const total = allSelections.reduce((sum, selection) => sum + selection.subTotal, 0);
  const remaining = target - count;

  // What was chosen on top of the plain product
  const describe = (sandwich, selection) => {
    const bread = isDrink(sandwich)
      ? null
      : breadTypes.find((b) => b.slug === selection.breadType)?.name;
    const sauce = selection.sauce && selection.sauce !== "geen" ? selection.sauce : null;
    return [bread, sauce, ...(selection.toppings || [])].filter(Boolean).join(" · ");
  };

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="m-0 font-display text-[22px] font-normal tracking-[0.02em] text-noon">
        Jouw bestelling
      </h2>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-mist">
            <strong className="text-lg font-semibold tabular-nums text-noon">{count}</strong> van {target}
          </span>
          <span className="font-semibold text-noon">
            {remaining > 0 ? `Nog ${remaining} te gaan` : "Compleet"}
          </span>
        </div>
        <ProgressBar value={target > 0 ? (count / target) * 100 : 0} />
      </div>

      {groupedSelections.length === 0 ? (
        <p className="m-0 border-t border-noon/10 pt-4 text-sm text-mist">Geen items geselecteerd</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 border-t border-noon/10 p-0 pt-4">
          {groupedSelections.flatMap(({ sandwich, selections }) =>
            selections.map((selection, index) => (
              <li key={`${sandwich._id}-${index}`} className="flex items-start gap-2 text-sm">
                <span className="w-7 shrink-0 font-semibold tabular-nums text-noon">
                  {selection.quantity}×
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-noon">{sandwich.name}</span>
                  {describe(sandwich, selection) && (
                    <span className="block text-xs leading-[1.4] text-mist">
                      {describe(sandwich, selection)}
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-noon">{formatEuro(selection.subTotal)}</span>
                <button
                  type="button"
                  onClick={() => onRemove(sandwich._id, index)}
                  aria-label={`${sandwich.name} verwijderen`}
                  className="-mr-1 -mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-mist hover:bg-blush hover:text-noon"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      <div className="flex items-baseline justify-between border-t border-noon/10 pt-4">
        <span className="text-sm text-mist">Totaal excl. btw</span>
        <span className="text-lg font-bold tabular-nums text-noon">{formatEuro(total)}</span>
      </div>
    </Card>
  );
};

export default SelectedSandwichesList;
