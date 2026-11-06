"use client";
import React from "react";
import MenuCategories from "@/app/components/MenuCategories";
import VarietySelector from "@/app/components/VarietySelector";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EXTRA_GROUPS, extraPrice } from "@/app/assets/extras";
import { Card, Heading, OptionCard, QuantityStepper, formatEuro } from "@/app/components/order/ui";

const extrasCount = (formData, group) =>
  group.items.reduce((sum, item) => sum + (formData[group.id]?.[item.key] || 0), 0);

const extrasTotal = (formData, group, pricing) =>
  group.items.reduce(
    (sum, item) => sum + (formData[group.id]?.[item.key] || 0) * extraPrice(pricing, group, item),
    0
  );

const ExtrasGroup = ({ group, formData, updateFormData, pricing }) => {
  const count = extrasCount(formData, group);
  const open = formData[group.flag] || false;

  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-center gap-3">
        <Checkbox
          id={group.flag}
          checked={open}
          onCheckedChange={(checked) => updateFormData(group.flag, checked === true)}
        />
        <Label htmlFor={group.flag} className="cursor-pointer text-[15px] font-semibold text-noon">
          {group.question}
        </Label>
      </div>

      {open && (
        <div className="mt-4 flex flex-col gap-3 border-t border-noon/10 pt-4">
          {group.items.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="m-0 text-sm font-medium text-noon">{item.label}</p>
                <p className="m-0 text-xs text-mist">{formatEuro(extraPrice(pricing, group, item))} per stuk</p>
              </div>
              <QuantityStepper
                label={item.label}
                size="sm"
                value={formData[group.id]?.[item.key] || 0}
                onChange={(value) =>
                  updateFormData(group.id, {
                    ...formData[group.id],
                    [item.key]: value === "" ? 0 : value,
                  })
                }
              />
            </div>
          ))}

          {count > 0 && (
            <div className="flex justify-between border-t border-noon/10 pt-3 text-sm">
              <span className="text-mist">
                Totaal {group.title.toLowerCase()}: {count}
              </span>
              <span className="font-semibold text-noon">
                {formatEuro(extrasTotal(formData, group, pricing))} excl. btw
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

const SelectionTypeStep = ({ formData, updateFormData, sandwichOptions, breadTypes, sauceTypes, toppingTypes, pricing }) => {
  return (
    <div className="flex flex-col gap-8">
      <Heading title="Kies je selectie" />

      <div role="radiogroup" aria-label="Soort selectie" className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <OptionCard
          active={formData.selectionType === "custom"}
          title="Stel je eigen selectie samen"
          subtitle="Kies je broodjes uit het hele menu"
          onClick={() => updateFormData("selectionType", "custom")}
        />
        <OptionCard
          active={formData.selectionType === "variety"}
          title="Verrassing aanbod"
          subtitle="Laat ons je verrassen! :)"
          onClick={() => updateFormData("selectionType", "variety")}
        />
      </div>

      {formData.selectionType === "custom" && (
        <MenuCategories
          sandwichOptions={sandwichOptions}
          formData={formData}
          updateFormData={updateFormData}
          breadTypes={breadTypes}
          sauceTypes={sauceTypes}
          toppingTypes={toppingTypes}
        />
      )}

      {formData.selectionType === "variety" && (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <Heading
              as="h2"
              size="md"
              title="Kies een verdeling"
              lead="Kies een mix en wij doen de rest. Aanpassen kan per soort."
            />
            <VarietySelector
              formData={formData}
              updateFormData={updateFormData}
              pricing={pricing}
            />
          </div>

          <div className="flex flex-col gap-5">
            <Heading as="h2" size="md" title="Maak het compleet" lead="Dranken, soep of iets zoets erbij." />
            <div className="flex flex-col gap-3">
              {EXTRA_GROUPS.map((group) => (
                <ExtrasGroup
                  key={group.id}
                  group={group}
                  formData={formData}
                  updateFormData={updateFormData}
                  pricing={pricing}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionTypeStep;
