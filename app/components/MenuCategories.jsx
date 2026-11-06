import React, { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import SelectionManager from "./SelectionManager";
import SelectedSandwichesList from "./SelectedSandwichesList";
import { Heading, formatEuro } from "@/app/components/order/ui";
import { productImageKey, productImageLoader } from "@/lib/sanity-image";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

function ProductCard({ item, formData, updateFormData, breadTypes, sauceTypes, toppingTypes }) {
  const selected = (formData.customSelection[item._id] || []).reduce(
    (total, selection) => total + selection.quantity,
    0
  );
  const imageKey = productImageKey(item.image);

  return (
    <article
      className={cn(
        "flex overflow-hidden rounded-[14px] border bg-paper transition-colors sm:flex-col",
        selected > 0 ? "border-noon" : "border-noon/10 hover:border-noon/25"
      )}
    >
      {/* Mobile: a fixed square thumbnail, so every product is cropped the same.
          Desktop: a 5:4 photo across the top of the card. */}
      <div className="relative m-3 mr-0 h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[10px] bg-blush sm:m-0 sm:aspect-[5/4] sm:h-auto sm:w-auto sm:rounded-none">
        {imageKey && (
          <Image
            loader={productImageLoader(item.image, { aspect: 5 / 4 })}
            src={imageKey}
            alt={item.name}
            fill
            sizes="(min-width: 1280px) 280px, (min-width: 640px) 45vw, 104px"
            className="object-cover"
          />
        )}
        {selected > 0 && (
          <span className="absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-coral px-1.5 text-xs font-bold tabular-nums text-white">
            {selected}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3.5 sm:p-4">
        <h4 className="m-0 text-[15px] font-semibold text-noon sm:text-base">{item.name}</h4>
        {item.description && (
          <p className="m-0 line-clamp-3 text-[13px] leading-[1.5] text-mist">{item.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-[15px] font-semibold tabular-nums text-noon">{formatEuro(item.price)}</span>
          <SelectionManager
            sandwich={item}
            formData={formData}
            updateFormData={updateFormData}
            totalAllowed={formData.totalSandwiches}
            breadTypes={breadTypes}
            sauceTypes={sauceTypes}
            toppingTypes={toppingTypes}
          />
        </div>
      </div>
    </article>
  );
}

const MenuCategories = ({ sandwichOptions, formData, updateFormData, breadTypes, sauceTypes, toppingTypes }) => {
  const categoryRefs = useRef({});
  const [activeCategory, setActiveCategory] = useState("");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isManualScrolling, setIsManualScrolling] = useState(false);
  const scrollTriggersRef = useRef([]);

  if (!Array.isArray(sandwichOptions) || !formData || !updateFormData) {
    return <div className="p-4 text-destructive">Missing required props</div>;
  }

  // Get type categories only for navigation (not subcategories)
  const typeCategories = useMemo(() => {
    const categoryMap = new Map();

    sandwichOptions.forEach(item => {
      if (item.typeCategory) {
        const typeCategoryValue = item.typeCategory?.value || item.typeCategory;
        const typeCategoryName = item.typeCategory?.name || item.typeCategory;
        const typeCategoryOrderRank = item.typeCategory?.orderRank;

        if (!categoryMap.has(typeCategoryValue)) {
          categoryMap.set(typeCategoryValue, {
            id: typeCategoryValue,
            name: typeCategoryName,
            value: typeCategoryValue,
            orderRank: typeCategoryOrderRank
          });
        }
      }
    });

    // Sort by orderRank from Sanity (if available), fallback to alphabetical
    return Array.from(categoryMap.values()).sort((a, b) => {
      if (a.orderRank && b.orderRank) {
        return a.orderRank.localeCompare(b.orderRank);
      } else {
        return a.value.localeCompare(b.value);
      }
    });
  }, [sandwichOptions]);

  // Get subcategories grouped by type category for content display
  const subcategoriesByType = useMemo(() => {
    const grouped = new Map();

    sandwichOptions.forEach(item => {
      if (item.typeCategory && item.subCategory) {
        const typeCategoryValue = item.typeCategory?.value || item.typeCategory;
        const subCategoryValue = item.subCategory?.value || item.subCategory;
        const subCategoryName = item.subCategory?.name || item.subCategory;
        const subCategoryOrderRank = item.subCategory?.orderRank;

        if (!grouped.has(typeCategoryValue)) {
          grouped.set(typeCategoryValue, new Map());
        }

        const subCatMap = grouped.get(typeCategoryValue);
        if (!subCatMap.has(subCategoryValue)) {
          subCatMap.set(subCategoryValue, {
            value: subCategoryValue,
            name: subCategoryName,
            orderRank: subCategoryOrderRank
          });
        }
      }
    });

    // Sort subcategories within each type
    const result = new Map();
    grouped.forEach((subCatMap, typeValue) => {
      const sorted = Array.from(subCatMap.values()).sort((a, b) => {
        if (a.orderRank && b.orderRank) {
          return a.orderRank.localeCompare(b.orderRank);
        } else {
          return a.value.localeCompare(b.value);
        }
      });
      result.set(typeValue, sorted);
    });

    return result;
  }, [sandwichOptions]);

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addListener(handleChange);

    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // Set initial active category only once
  useEffect(() => {
    if (typeCategories.length > 0 && !activeCategory) {
      setActiveCategory(typeCategories[0]?.value || "");
    }
  }, [typeCategories, activeCategory]);

  // Set up GSAP ScrollTriggers for category detection
  useEffect(() => {
    if (typeCategories.length === 0) return;

    // Clean up existing triggers
    scrollTriggersRef.current.forEach(trigger => trigger.kill());
    scrollTriggersRef.current = [];

    // Create ScrollTrigger for each type category
    typeCategories.forEach((category) => {
      const element = categoryRefs.current[category.value];
      if (element) {
        const trigger = ScrollTrigger.create({
          trigger: element,
          start: "top 50%",
          end: "bottom 50%",
          onEnter: () => {
            if (!isManualScrolling) {
              setActiveCategory(category.value);
            }
          },
          onEnterBack: () => {
            if (!isManualScrolling) {
              setActiveCategory(category.value);
            }
          },
        });

        scrollTriggersRef.current.push(trigger);
      }
    });

    return () => {
      // Cleanup ScrollTriggers
      scrollTriggersRef.current.forEach(trigger => trigger.kill());
      scrollTriggersRef.current = [];
    };
  }, [typeCategories, isManualScrolling]);

  // Cleanup GSAP animations on unmount
  useEffect(() => {
    return () => {
      gsap.killTweensOf(window);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);



  const handleRemoveSelection = (sandwichId, indexToRemove) => {
    const currentSelections = formData.customSelection[sandwichId] || [];
    const updatedSelections = currentSelections.filter(
      (_, index) => index !== indexToRemove
    );
    updateFormData("customSelection", {
      ...formData.customSelection,
      [sandwichId]: updatedSelections,
    });
  };

  const scrollToCategory = (categoryValue) => {
    // Immediately set the active category and disable automatic tracking
    setActiveCategory(categoryValue);
    setIsManualScrolling(true);

    // Use native browser scrolling with ID
    const element = document.getElementById(`category-${categoryValue}`);
    if (element) {
      element.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    }

    // Re-enable automatic tracking after scroll completes
    // Longer delay to ensure smooth scroll finishes before ScrollTrigger takes over
    setTimeout(() => {
      setIsManualScrolling(false);
      // Force ScrollTrigger refresh after manual scroll
      ScrollTrigger.refresh();
    }, 1500);
  };

  return (
    <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
      <div className="min-w-0">
        {/* Navigation - type categories only */}
        <nav
          aria-label="Menu"
          className="sticky top-[66px] z-20 -mx-4 overflow-x-auto bg-cream/95 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 backdrop-blur md:top-[82px] md:-mx-8 md:px-8 lg:mx-0 lg:px-0"
        >
          <div className="flex min-w-max gap-6 border-b border-noon/10">
            {typeCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => scrollToCategory(category.value)}
                aria-current={activeCategory === category.value ? "true" : undefined}
                className={cn(
                  "eyebrow -mb-px border-b-2 py-3.5 outline-none transition-colors",
                  activeCategory === category.value
                    ? "border-noon text-noon"
                    : "border-transparent text-noon/50 hover:text-noon"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </nav>

        {/* All categories in one scrollable container */}
        <div className="mt-8 flex flex-col gap-12">
          {typeCategories.map((typeCategory) => {
            const subCategories = subcategoriesByType.get(typeCategory.value) || [];

            return (
              <section
                key={typeCategory.id}
                id={`category-${typeCategory.value}`}
                ref={(el) => (categoryRefs.current[typeCategory.value] = el)}
                data-category={typeCategory.value}
                className="flex scroll-mt-32 flex-col gap-6 md:scroll-mt-36"
              >
                <Heading as="h2" size="md" title={typeCategory.name} />

                {subCategories.map((subCategory) => (
                  <div key={`${typeCategory.value}-${subCategory.value}`} className="flex flex-col gap-3">
                    {subCategory.name !== typeCategory.name && (
                      <h3 className="eyebrow m-0">{subCategory.name}</h3>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {sandwichOptions
                        .filter((item) => {
                          const typeCategoryValue = item.typeCategory?.value || item.typeCategory;
                          const subCategoryValue = item.subCategory?.value || item.subCategory;
                          return typeCategoryValue === typeCategory.value &&
                                 subCategoryValue === subCategory.value;
                        })
                        .map((item) => (
                          <ProductCard
                            key={item._id}
                            item={item}
                            formData={formData}
                            updateFormData={updateFormData}
                            breadTypes={breadTypes}
                            sauceTypes={sauceTypes}
                            toppingTypes={toppingTypes}
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      </div>

      <aside className="lg:sticky lg:top-[106px] lg:max-h-[calc(100vh-200px)] lg:self-start lg:overflow-y-auto">
        <SelectedSandwichesList
          selections={formData.customSelection}
          sandwichOptions={sandwichOptions}
          onRemove={handleRemoveSelection}
          breadTypes={breadTypes}
          target={formData.numberOfPeople}
        />
      </aside>
    </div>
  );
};

export default MenuCategories;
