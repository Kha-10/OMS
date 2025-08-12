import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "../ui/label";

export default function SortControls({ sortBy, sortDirection, onSortChange }) {
  const handleFieldChange = (field) => {
    onSortChange(field, sortDirection); // Keep the current direction
  };

  const handleDirectionChange = (direction) => {
    onSortChange(sortBy, direction); // Keep the current field
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        {/* Sorting Field Options */}
        <h4 className="text-sm font-medium text-gray-900">Sort By</h4>
        <RadioGroup
          value={sortBy}
          onValueChange={(value) => onSortChange(value, "desc")} // Default direction to 'desc'
          className="flex flex-col gap-2"
        >
          <Label className="flex items-center gap-2">
            <RadioGroupItem
              value="date"
              id="date"
              className="border-[1.5px] text-white border-gray-300 
              before:h-2 before:w-2 before:bg-white
              data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500
              data-[state=checked]:before:bg-white"
            />
            <span>Date</span>
          </Label>
          <Label className="flex items-center gap-2">
            <RadioGroupItem value="amount" id="amount" />
            <span>Total Amount</span>
          </Label>
        </RadioGroup>
      </div>

      {/* Sorting Direction Options */}
      {sortBy && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Direction</h4>
          <RadioGroup
            value={sortDirection}
            onValueChange={(value) => onSortChange(sortBy, value)}
            className="flex flex-col gap-2"
          >
            {sortBy === "amount" ? (
              <>
                <Label className="flex items-center gap-2">
                  <RadioGroupItem value="asc" id="asc-amount" />
                  <span>Lowest first</span>
                </Label>
                <Label className="flex items-center gap-2">
                  <RadioGroupItem
                    value="desc"
                    id="desc-amount"
                    className="border-[1.5px] text-white border-gray-300 
              before:h-2 before:w-2 before:bg-white
              data-[state=checked]:border-blue