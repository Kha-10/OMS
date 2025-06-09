import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "../ui/label";

export default function FilterPanel({
  isOpen,
  onClose,
  onClearFilters,
  onFiltersChange,
  activeFilters,
  filterSections,
}) {
  const [expandedSections, setExpandedSections] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState(activeFilters);

  useEffect(() => {
    setSelectedFilters(activeFilters);
  }, [activeFilters]);

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const toggleFilter = (sectionId, optionId) => {
    const updatedFilters = { ...selectedFilters };
    const currentSection = updatedFilters[sectionId] || [];

    if (currentSection.includes(optionId)) {
      updatedFilters[sectionId] = currentSection.filter(
        (id) => id !== optionId
      );
      if (updatedFilters[sectionId].length === 0) {
        delete updatedFilters[sectionId];
      }
    } else {
      updatedFilters[sectionId] = [...currentSection, optionId];
    }

    setSelectedFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const handleClearFilters = () => {
    setSelectedFilters({});
    onClearFilters();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0">
        <SheetHeader className="p-6 border-b border-gray-200">
          <SheetTitle>More filters</SheetTitle>
          <SheetDescription className="sr-only hidden"></SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6">
          <div className="py-6 space-y-6">
            {filterSections.map((section) => (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between text-sm font-medium py-1"
                >
                  <Label className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {section.label}
                  </Label>
                  {expandedSections.includes(section.id) ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </button>
                {expandedSections.includes(section.id) &&
                  section.options.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {section.options.map((option) => (
                        <label
                          key={option.id}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <Checkbox
                            className="w-5 h-5 peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-gray-300"
                            id={`${section.id}-${option.id}`}
                            checked={(
                              selectedFilters[section.id] || []
                            ).includes(option.id)}
                            onCheckedChange={() =>
                              toggleFilter(section.id, option.id)
                            }
                          />
                          <Label
                            htmlFor={option.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {option.label}
                          </Label>
                        </label>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>

        <SheetFooter className="p-6 border-t border-gray-200">
          <button
            onClick={handleClearFilters}
            className="w-full py-2 text-center border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Clear all filters
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
