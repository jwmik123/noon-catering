// Extras offered next to the surprise selection. Prices come from Sanity
// (pricing[group][key]); `fallback` is used until they are set there.
export const EXTRA_GROUPS = [
  {
    id: "drinks",
    flag: "addDrinks",
    question: "Wil je dranken toevoegen?",
    title: "Dranken",
    items: [
      { key: "freshOrangeJuice", label: "Vers sinaasappelsap", fallback: 3.35 },
      { key: "sodas", label: "Frisdranken", fallback: 2.35 },
    ],
  },
  {
    id: "soup",
    flag: "addSoup",
    question: "Wil je soep toevoegen?",
    title: "Soep",
    items: [
      { key: "soup_small", label: "Soep - 400ml", fallback: 3.8 },
      { key: "soup_large", label: "Soep - 1000ml", fallback: 6.4 },
    ],
  },
  {
    id: "desserts",
    flag: "addDesserts",
    question: "Wil je desserts toevoegen?",
    title: "Desserts",
    items: [
      { key: "desserts", label: "Desserts", fallback: 3.5 },
      { key: "cookies", label: "Koekjes", fallback: 2.5 },
    ],
  },
];

export const extraPrice = (pricing, group, item) =>
  pricing?.[group.id]?.[item.key] || item.fallback;
