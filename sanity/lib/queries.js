import { defineQuery } from "next-sanity";

export const PRODUCT_QUERY = defineQuery(`*[_type == "product" && active == true] | order(orderRank asc) {
  _id,
  _createdAt,
  name,
  description,
  image,
  allergyInfo,
  allergyNotes,
  price,
  typeCategory,
  subCategory,
  orderRank,
  active,
  hasSauceOptions,
  sauceOptions[] {
    name,
    price,
    isDefault
  },
  hasToppings,
  toppingOptions[] {
    topping->{
      _id,
      name,
      price,
      description,
      allergyInfo
    },
    isDefault
  }
}`);

export const BREAD_TYPES_QUERY = defineQuery(`*[_type == "breadType" && isAvailable == true] | order(sortOrder asc) {
  _id,
  name,
  slug,
  surcharge,
  description,
  sortOrder
}`);

export const SAUCE_TYPES_QUERY = defineQuery(`*[_type == "sauceType" && isAvailable == true] | order(sortOrder asc) {
  _id,
  name,
  slug,
  description,
  allergyInfo,
  sortOrder
}`);

export const TOPPING_TYPES_QUERY = defineQuery(`*[_type == "toppingType" && isAvailable == true] | order(sortOrder asc) {
  _id,
  name,
  slug,
  description,
  allergyInfo,
  sortOrder
}`);

export const PRICING_QUERY = defineQuery(`*[_type == "pricing" && active == true][0] {
  _id,
  name,
  categoryPricing[] {
    typeCategory,
    description,
    subCategoryPricing[] {
      subCategory,
      price
    },
    boxTypes[] {
      boxType,
      displayName,
      price,
      description
    }
  },
  drinks {
    freshOrangeJuice,
    sodas
  },
  desserts {
    desserts,
    cookies
  }
}`);
