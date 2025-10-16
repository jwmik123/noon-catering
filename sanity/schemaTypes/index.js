import { product } from "./productType";
import { quote } from "./quoteType";
import { invoice } from "./invoiceType";
import { breadType } from "./breadType";
import { sauceType } from "./sauceType";
import { toppingType } from "./toppingType";
import { pricing } from "./pricingType";
import { typeCategory } from "./typeCategoryType";
import { subCategory } from "./subCategoryType";

export const schema = {
  types: [product, quote, invoice, breadType, sauceType, toppingType, pricing, typeCategory, subCategory],
};
