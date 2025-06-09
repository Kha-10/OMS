import { useState,useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "../ui/label";
import { X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSearchParams } from "react-router-dom";
import { updateQueryParams } from "@/helper/updateQueryParams";
import useCategories from "@/hooks/useCategories";

export default function FilterPanel({
  isOpen,
  onClose,
  visibility,
  params,
  setSearchParams,
  clearAllFilters,
}) {
  const { data } = useCategories();
  const categories = data?.data || [];
  const categoriesArray = params.get("categories")?.split(",");

  const handleCategoryChange = (category) => {
    const updatedCategories = categoriesArray?.includes(category)
      ? categoriesArray.filter((c) => c !== category)
      : [...(categoriesArray || []), category];

    if (updatedCategories.length > 0) {
      params.set("categories", updatedCategories.join(","));
    } else {
      params.delete("categories");
    }

    updateQueryParams(params, setSearchParams);
  };

  const handleVisibilityChange = (value) => {
    params.set("visibility", value);
    updateQueryParams(params, setSearchParams);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0">
        <SheetHeader className="p-6 flex flex-row items-center justify-between border-b border-gray-200">
          <SheetTitle>More filters</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6">
          <div className="">
            <Accordion type="single" collapsible className="py-2">
              <AccordionItem value="category">
                <AccordionTrigger className="px-1">Category</AccordionTrigger>
                <AccordionContent className="px-1">
                  <div className="space-y-4">
                    {categories.length > 0 &&
                      categories.map((category) => (
                        <div
                          key={category._id}
                          className="flex items-center gap-3"
                        >
                          <Checkbox
                            id={category._id}
                            className="w-5 h-5 peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-gray-300"
                            checked={
                              categoriesArray
                                ? categoriesArray.includes(category._id)
                                : false
                            }
                            onCheckedChange={() =>
                              handleCategoryChange(category._id)
                            }
                          />
                          <Label
                            htmlFor={category._id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {category.name}
                          </Label>
                        </div>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="visibility">
                <AccordionTrigger className="px-1">Visibility</AccordionTrigger>
                <AccordionContent>
                  <RadioGroup
                    className="px-1"
                    value={visibility}
                    onValueChange={handleVisibilityChange}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="visible"
                        id="visible"
                        className="h-5 w-5 border-[1.5px] border-gray-300 
                        before:h-2 before:w-2 before:bg-white
                        data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500
                        data-[state=checked]:before:bg-white text-white"
                      />
                      <Label
                        htmlFor="visible"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Visible
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                      <RadioGroupItem
                        value="hidden"
                        id="hidden"
                        className="h-5 w-5 border-[1.5px] border-gray-300 
                        before:h-2 before:w-2 before:bg-white
                        data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500
                        data-[state=checked]:before:bg-white text-white"
                      />
                      <Label
                        htmlFor="hidden"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Hidden
                      </Label>
                    </div>
                  </RadioGroup>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
        <SheetFooter className="p-6 border-t border-gray-200">
          <button
            onClick={clearAllFilters}
            className="w-full py-2 text-center border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Clear all filters
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
