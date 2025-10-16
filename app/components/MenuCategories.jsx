import React, { useMemo, useRef, useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SelectionManager from "./SelectionManager";
import { urlFor } from "@/sanity/lib/image";
import SelectedSandwichesList from "./SelectedSandwichesList";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const MenuCategories = ({ sandwichOptions, formData, updateFormData, breadTypes, sauceTypes, toppingTypes }) => {
  const categoryRefs = useRef({});
  const buttonRefs = useRef({});
  const [activeCategory, setActiveCategory] = useState("");
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isManualScrolling, setIsManualScrolling] = useState(false);
  const scrollTriggersRef = useRef([]);

  if (!Array.isArray(sandwichOptions) || !formData || !updateFormData) {
    return <div className="p-4 text-red-600">Missing required props</div>;
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



  // Update indicator position when active category changes
  useEffect(() => {
    const updateIndicatorPosition = () => {
      const activeButton = buttonRefs.current[activeCategory];
      if (!activeButton) return;

      // Get the index of active category
      const activeIndex = typeCategories.findIndex(cat => cat.value === activeCategory);
      if (activeIndex === -1) return;

      setIndicatorStyle({
        transform: `translateX(${activeIndex * 100}%)`,
        width: `${100 / typeCategories.length}%`,
      });
    };

    if (activeCategory && typeCategories.length > 0) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(updateIndicatorPosition);
    }
  }, [activeCategory, typeCategories]);

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
    <div className="w-full">
      {/* Navigation tabs - Type categories only */}
      <div className="sticky top-32 z-10 bg-primary rounded-md text-white">
        <div className="relative grid w-full px-2 py-3 sm:px-3 sm:py-2 md:px-4 md:py-2" style={{ gridTemplateColumns: `repeat(${typeCategories.length}, 1fr)` }}>
          {/* Sliding indicator - simplified approach */}
          <div
            className={`absolute inset-y-3 sm:inset-y-2 md:inset-y-2 bg-white rounded-md ${
              prefersReducedMotion
                ? ''
                : 'transition-transform duration-300 ease-out'
            }`}
            style={{
              width: indicatorStyle.width || `${100 / typeCategories.length}%`,
              transform: indicatorStyle.transform || 'translateX(0)',
              left: '0.5rem',
              right: '0.5rem',
              willChange: !prefersReducedMotion && activeCategory ? 'transform' : 'auto',
            }}
          />
          {typeCategories.map((category) => (
            <button
              key={category.id}
              ref={(el) => (buttonRefs.current[category.value] = el)}
              onClick={() => scrollToCategory(category.value)}
              className={`relative z-10 w-full px-1 py-2 sm:px-2 sm:py-1 md:px-4 md:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors outline-none ${
                activeCategory === category.value
                  ? "text-primary font-bold"
                  : "text-white hover:text-gray-200"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* All categories in one scrollable container */}
      <div className="mt-4 sm:mt-6 space-y-8 sm:space-y-10 md:space-y-12">
        {typeCategories.map((typeCategory) => {
          const subCategories = subcategoriesByType.get(typeCategory.value) || [];

          return (
            <section
              key={typeCategory.id}
              id={`category-${typeCategory.value}`}
              ref={(el) => (categoryRefs.current[typeCategory.value] = el)}
              data-category={typeCategory.value}
              className="scroll-mt-36 sm:scroll-mt-48"
            >
              {/* Type Category title */}
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-foreground">
                {typeCategory.name}
              </h2>

              {/* Subcategories within this type category */}
              <div className="space-y-8">
                {subCategories.map((subCategory) => (
                  <div key={`${typeCategory.value}-${subCategory.value}`}>
                    {/* Subcategory heading */}
                    <h3 className="text-lg sm:text-xl font-semibold mb-4 text-foreground/80">
                      {subCategory.name}
                    </h3>

                    {/* Products in this subcategory */}
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                      {sandwichOptions
                        .filter((item) => {
                          const typeCategoryValue = item.typeCategory?.value || item.typeCategory;
                          const subCategoryValue = item.subCategory?.value || item.subCategory;
                          return typeCategoryValue === typeCategory.value &&
                                 subCategoryValue === subCategory.value;
                        })
                        .map((item) => (
                          <div key={item._id} className="relative">
                            {/* this is the card for each sandwich */}
                            <div
                              key={item._id}
                              className="relative flex justify-between gap-4 p-4 rounded-lg shadow-md min-h-44"
                            >
                              <div className="w-1/2">
                                <div className="flex flex-col gap-1">
                                  <h3 className="text-lg font-bold">{item.name}</h3>
                                  <p className="text-sm">{item.description}</p>
                                  <p className="mt-1 text-sm font-medium">
                                    €{item.price.toFixed(2)}
                                  </p>
                                  {item.subCategory && (
                                    <div className="mt-2 text-xs font-medium rounded text-muted-foreground">
                                      <span className="px-2 py-1 rounded-sm bg-muted">
                                        {item.subCategory?.name || item.subCategory}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="relative w-1/2 -m-4 overflow-hidden">
                                <div
                                  className="absolute inset-0 bg-center bg-cover"
                                  style={{
                                    backgroundImage: `url(${urlFor(item.image).url()})`,
                                  }}
                                />
                              </div>
                            </div>
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
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Add the selected sandwiches list */}
      <SelectedSandwichesList
        selections={formData.customSelection}
        sandwichOptions={sandwichOptions}
        onRemove={handleRemoveSelection}
        breadTypes={breadTypes}
      />
    </div>
  );
};

export default MenuCategories;
