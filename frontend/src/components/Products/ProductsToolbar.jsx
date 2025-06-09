import React from "react";
import { useState } from "react";
import { Search, ArrowUpDown, Download, Filter, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import SortControls from "@/components/Products/SortControls";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function ProductsToolbar({
  text,
  show,
  searchQuery,
  onSearchChange,
  clearSearch,
  onShowFilters,
  sorts,
  sortBy,
  sortDirection,
  params,
  setSearchParams,
}) {
  const handleSortChange = (field, direction) => {
    params.set("sortBy", field);
    params.set("sortDirection", direction);
    params.set("page", 1);
    setSearchParams(params);
  };
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative flex-grow">
        <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={text}
          className="pl-8 bg-card border-input w-full focus:ring-blue-500 focus:ring-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus:border-input focus:ring-ring"
          value={searchQuery}
          onChange={(e) => onSearchChange(e)}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute  right-0 top-0 h-full px-3 py-2"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {show && (
          <button
            onClick={onShowFilters}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Filter size={20} />
          </button>
        )}
        <Popover>
          <PopoverTrigger className="text-gray-600 hover:bg-gray-100 rounded-lg">
            <ArrowUpDown size={20} />
          </PopoverTrigger>
          <PopoverContent className="w-fit p-0 -ml-[120px]">
            <SortControls
              sorts={sorts}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSortChange={handleSortChange}
              params={params}
              setSearchParams={setSearchParams}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
