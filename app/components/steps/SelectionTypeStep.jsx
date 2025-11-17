"use client";
import React from "react";
import { Utensils } from "lucide-react";
import MenuCategories from "@/app/components/MenuCategories";
import VarietySelector from "@/app/components/VarietySelector";

const SelectionTypeStep = ({ formData, updateFormData, sandwichOptions, breadTypes, sauceTypes, toppingTypes, pricing }) => {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 items-center text-lg font-medium text-custom-gray">
        <Utensils className="w-5 h-5" />
        <h2 className="text-gray-700">Kies je selectie</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div
          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            formData.selectionType === "custom"
              ? "border-black bg-beige-50"
              : "border-custom-gray/20 hover:border-custom-gray/30"
          }`}
          onClick={() => updateFormData("selectionType", "custom")}
        >
          <h3 className="mb-2 text-lg font-medium">
            Stel je eigen selectie samen
          </h3>
          <p className="text-sm text-custom-gray">Kies je broodjes</p>
        </div>

        <div
          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            formData.selectionType === "variety"
              ? "border-black bg-beige-50"
              : "border-custom-gray/20 hover:border-custom-gray/30"
          }`}
          onClick={() => updateFormData("selectionType", "variety")}
        >
          <h3 className="mb-2 text-lg font-medium">Verrassing aanbod</h3>
          <p className="text-sm text-custom-gray">Laat ons je verrassen! :)</p>
        </div>
      </div>

      {formData.selectionType === "custom" && (
        <div className="mt-6">
          <MenuCategories
            sandwichOptions={sandwichOptions}
            formData={formData}
            updateFormData={updateFormData}
            breadTypes={breadTypes}
            sauceTypes={sauceTypes}
            toppingTypes={toppingTypes}
          />

          <div className="p-4 mt-6 rounded-lg bg-custom-gray/10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-custom-gray">Geselecteerde items</p>
                <p className="text-lg font-medium">
                  {Object.values(formData.customSelection)
                    .flat()
                    .reduce(
                      (total, selection) => total + selection.quantity,
                      0
                    )}
                </p>
              </div>
              <div>
                <p className="text-sm text-custom-gray">Totaal bedrag</p>
                <p className="text-lg font-medium">
                  €
                  {Object.values(formData.customSelection)
                    .flat()
                    .reduce(
                      (total, selection) => total + selection.subTotal,
                      0
                    )
                    .toFixed(2)}{" "}
                  excl. BTW
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {formData.selectionType === "variety" && (
        <>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Kies een verdeling
              </h3>
              <VarietySelector
                totalSandwiches={formData.totalSandwiches}
                formData={formData}
                updateFormData={updateFormData}
                pricing={pricing}
              />
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="addDrinks"
                  checked={formData.addDrinks || false}
                  onChange={(e) => updateFormData("addDrinks", e.target.checked)}
                  className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2"
                />
                <label htmlFor="addDrinks" className="text-lg font-medium text-gray-900 cursor-pointer">
                  Wil je dranken toevoegen?
                </label>
              </div>

              {formData.addDrinks && (
                <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-md font-medium text-gray-800">Selecteer dranken</h4>

                  {/* Fresh Orange Juice */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Vers sinaasappelsap</label>
                      <div className="text-xs text-gray-500">
                        €{pricing?.drinks?.freshOrangeJuice?.toFixed(2) || '3.35'} per stuk
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.drinks?.freshOrangeJuice || 0;
                          const newAmount = Math.max(0, current - 1);
                          updateFormData("drinks", {
                            ...formData.drinks,
                            freshOrangeJuice: newAmount
                          });
                        }}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        disabled={!formData.drinks?.freshOrangeJuice || formData.drinks?.freshOrangeJuice <= 0}
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">
                        {formData.drinks?.freshOrangeJuice || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.drinks?.freshOrangeJuice || 0;
                          updateFormData("drinks", {
                            ...formData.drinks,
                            freshOrangeJuice: current + 1
                          });
                        }}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Sodas */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Frisdranken</label>
                      <div className="text-xs text-gray-500">
                        €{pricing?.drinks?.sodas?.toFixed(2) || '2.35'} per stuk
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.drinks?.sodas || 0;
                          const newAmount = Math.max(0, current - 1);
                          updateFormData("drinks", {
                            ...formData.drinks,
                            sodas: newAmount
                          });
                        }}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        disabled={!formData.drinks?.sodas || formData.drinks?.sodas <= 0}
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">
                        {formData.drinks?.sodas || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.drinks?.sodas || 0;
                          updateFormData("drinks", {
                            ...formData.drinks,
                            sodas: current + 1
                          });
                        }}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total drinks summary */}
                  {(formData.drinks?.freshOrangeJuice > 0 || formData.drinks?.sodas > 0) && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Totaal dranken: {(formData.drinks?.freshOrangeJuice || 0) + (formData.drinks?.sodas || 0)}
                        </span>
                        <span className="font-medium text-gray-800">
                          €{(
                            (formData.drinks?.freshOrangeJuice || 0) * (pricing?.drinks?.freshOrangeJuice || 3.35) +
                            (formData.drinks?.sodas || 0) * (pricing?.drinks?.sodas || 2.35)
                          ).toFixed(2)} excl. BTW
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="addSoup"
                  checked={formData.addSoup || false}
                  onChange={(e) => updateFormData("addSoup", e.target.checked)}
                  className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2"
                />
                <label htmlFor="addSoup" className="text-lg font-medium text-gray-900 cursor-pointer">
                  Wil je soep toevoegen?
                </label>
              </div>

              {formData.addSoup && (
                <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-md font-medium text-gray-800">Selecteer soep</h4>

                  {/* Soup Small (400ml) */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Soep 400ml</label>
                      <div className="text-xs text-gray-500">
                        €{pricing?.soup?.soup_small?.toFixed(2) || '3.80'} per stuk
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.soup?.soup_small || 0;
                          const newAmount = Math.max(0, current - 1);
                          updateFormData("soup", {
                            ...formData.soup,
                            soup_small: newAmount
                          });
                        }}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        disabled={!formData.soup?.soup_small || formData.soup?.soup_small <= 0}
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">
                        {formData.soup?.soup_small || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.soup?.soup_small || 0;
                          updateFormData("soup", {
                            ...formData.soup,
                            soup_small: current + 1
                          });
                        }}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Soup Large (1000ml) */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Soep 1000ml</label>
                      <div className="text-xs text-gray-500">
                        €{pricing?.soup?.soup_large?.toFixed(2) || '6.40'} per stuk
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.soup?.soup_large || 0;
                          const newAmount = Math.max(0, current - 1);
                          updateFormData("soup", {
                            ...formData.soup,
                            soup_large: newAmount
                          });
                        }}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        disabled={!formData.soup?.soup_large || formData.soup?.soup_large <= 0}
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">
                        {formData.soup?.soup_large || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.soup?.soup_large || 0;
                          updateFormData("soup", {
                            ...formData.soup,
                            soup_large: current + 1
                          });
                        }}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total soup summary */}
                  {(formData.soup?.soup_small > 0 || formData.soup?.soup_large > 0) && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Totaal soep: {(formData.soup?.soup_small || 0) + (formData.soup?.soup_large || 0)}
                        </span>
                        <span className="font-medium text-gray-800">
                          €{(
                            (formData.soup?.soup_small || 0) * (pricing?.soup?.soup_small || 3.80) +
                            (formData.soup?.soup_large || 0) * (pricing?.soup?.soup_large || 6.40)
                          ).toFixed(2)} excl. BTW
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="addDesserts"
                  checked={formData.addDesserts || false}
                  onChange={(e) => updateFormData("addDesserts", e.target.checked)}
                  className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2"
                />
                <label htmlFor="addDesserts" className="text-lg font-medium text-gray-900 cursor-pointer">
                  Wil je desserts toevoegen?
                </label>
              </div>

              {formData.addDesserts && (
                <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-md font-medium text-gray-800">Selecteer desserts</h4>

                  {/* Desserts */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Desserts</label>
                      <div className="text-xs text-gray-500">
                        €{pricing?.desserts?.desserts?.toFixed(2) || '3.50'} per stuk
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.desserts?.desserts || 0;
                          const newAmount = Math.max(0, current - 1);
                          updateFormData("desserts", {
                            ...formData.desserts,
                            desserts: newAmount
                          });
                        }}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        disabled={!formData.desserts?.desserts || formData.desserts?.desserts <= 0}
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">
                        {formData.desserts?.desserts || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.desserts?.desserts || 0;
                          updateFormData("desserts", {
                            ...formData.desserts,
                            desserts: current + 1
                          });
                        }}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Cookies */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Koekjes</label>
                      <div className="text-xs text-gray-500">
                        €{pricing?.desserts?.cookies?.toFixed(2) || '2.50'} per stuk
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.desserts?.cookies || 0;
                          const newAmount = Math.max(0, current - 1);
                          updateFormData("desserts", {
                            ...formData.desserts,
                            cookies: newAmount
                          });
                        }}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        disabled={!formData.desserts?.cookies || formData.desserts?.cookies <= 0}
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">
                        {formData.desserts?.cookies || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const current = formData.desserts?.cookies || 0;
                          updateFormData("desserts", {
                            ...formData.desserts,
                            cookies: current + 1
                          });
                        }}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total desserts summary */}
                  {(formData.desserts?.desserts > 0 || formData.desserts?.cookies > 0) && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Totaal desserts: {(formData.desserts?.desserts || 0) + (formData.desserts?.cookies || 0)}
                        </span>
                        <span className="font-medium text-gray-800">
                          €{(
                            (formData.desserts?.desserts || 0) * (pricing?.desserts?.desserts || 3.50) +
                            (formData.desserts?.cookies || 0) * (pricing?.desserts?.cookies || 2.50)
                          ).toFixed(2)} excl. BTW
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Total amount calculation - full width */}
          <div className="pt-4 mt-6 border-t">
            <div className="p-4 space-y-2 rounded-md bg-custom-gray/10">
              <div className="flex justify-between text-sm text-custom-gray">
                <span>Verrassing items</span>
                <span>{formData.totalSandwiches} items</span>
              </div>
              {formData.addDrinks && (formData.drinks?.freshOrangeJuice > 0 || formData.drinks?.sodas > 0) && (
                <>
                  <div className="flex justify-between text-sm text-custom-gray">
                    <span>Totaal dranken</span>
                    <span>
                      €{(
                        (formData.drinks?.freshOrangeJuice || 0) * (pricing?.drinks?.freshOrangeJuice || 3.35) +
                        (formData.drinks?.sodas || 0) * (pricing?.drinks?.sodas || 2.35)
                      ).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              {formData.addSoup && (formData.soup?.soup_small > 0 || formData.soup?.soup_large > 0) && (
                <>
                  <div className="flex justify-between text-sm text-custom-gray">
                    <span>Totaal soep</span>
                    <span>
                      €{(
                        (formData.soup?.soup_small || 0) * (pricing?.soup?.soup_small || 3.80) +
                        (formData.soup?.soup_large || 0) * (pricing?.soup?.soup_large || 6.40)
                      ).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              {formData.addDesserts && (formData.desserts?.desserts > 0 || formData.desserts?.cookies > 0) && (
                <>
                  <div className="flex justify-between text-sm text-custom-gray">
                    <span>Totaal desserts</span>
                    <span>
                      €{(
                        (formData.desserts?.desserts || 0) * (pricing?.desserts?.desserts || 3.50) +
                        (formData.desserts?.cookies || 0) * (pricing?.desserts?.cookies || 2.50)
                      ).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between pt-2 font-medium border-t text-custom-gray">
                <span>Geschat totaal</span>
                <span className="text-xs text-gray-500">
                  (Berekend in bestelsamenvatting)
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SelectionTypeStep; 