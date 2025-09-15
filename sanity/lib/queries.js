import { defineQuery } from "next-sanity";

export const PRODUCT_QUERY = defineQuery(`*[_type == "product"] {
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
  hasSauceOptions,
  sauceOptions[] {
    name,
    price,
    isDefault
  },
  hasToppings,
  toppingOptions[] {
    name,
    price,
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
