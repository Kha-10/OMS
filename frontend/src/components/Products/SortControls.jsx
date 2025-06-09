import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

export default function SortControls({
  sorts,
  sortBy,
  sortDirection,
  onSortChange,
  params,
  setSearchParams,
}) {
  const sortParams = sortBy;

  return (
    <div className="p-4 divide-y divide-gray-300 min-w-[150px]">
      <div className="pb-4">
        <h4 className="text-sm font-medium text-gray-900">Sort By</h4>
        <RadioGroup
          value={sortParams}
          onValueChange={(value) => {
            params.set("sortBy", value);
            setSearchParams(params);
          }}
          className="flex flex-col gap-2 mt-2"
        >
          {sorts.map((sort) => (
            <Label key={sort.id} className="flex items-center gap-2">
              <RadioGroupItem
                value={sort.id}
                id={sort.id}
                className="border-[1.5px] text-white border-gray-300 
              before:h-2 before:w-2 before:bg-white
              data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500
              data-[state=checked]:before:bg-white"
              />
              <span>
                {sort.name.charAt(0).toUpperCase() + sort.name.slice(1)}
              </span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {sortParams && (
        <div className="pt-4">
          <h4 className="text-sm font-medium text-gray-900">Direction</h4>
          <RadioGroup
            value={sortDirection}
            onValueChange={(value) => onSortChange(sortBy, value)}
            className="flex flex-col gap-2 mt-2"
          >
            {sortParams === "title" && (
              <>
                <Button
                  variant="ghost"
                  className={`w-full p-0 ${
                    params.get("sortDirection") === "asc"
                      ? "bg-accent"
                      : "font-normal"
                  }`}
                  onClick={() => {
                    params.set("sortDirection", "asc");
                    setSearchParams(params);
                  }}
                >
                  A-Z
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full p-0 ${
                    params.get("sortDirection") === "desc"
                      ? "bg-accent"
                      : "font-normal"
                  }`}
                  onClick={() => {
                    params.set("sortDirection", "desc");
                    setSearchParams(params);
                  }}
                >
                  Z-A
                </Button>
              </>
            )}
            {sortParams !== "title" && (
              <>
                <Button
                  variant="ghost"
                  className={`w-full p-0 ${
                    params.get("sortDirection") === "asc"
                      ? "bg-accent"
                      : "font-normal"
                  }`}
                  onClick={() => {
                    params.set("sortDirection", "asc");
                    setSearchParams(params);
                  }}
                >
                  Oldest first
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full p-0 ${
                    params.get("sortDirection") === "desc"
                      ? "bg-accent"
                      : "font-normal"
                  }`}
                  onClick={() => {
                    params.set("sortDirection", "desc");
                    setSearchParams(params);
                  }}
                >
                  Newest first
                </Button>
              </>
            )}
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
