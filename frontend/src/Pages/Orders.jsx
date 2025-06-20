import React, { useState, useMemo, useEffect } from "react";
import { Search, ArrowUpDown, Download, Filter } from "lucide-react";
import OrderList from "@/components/Orders/OrderList";
import OrdersHeader from "@/components/Orders/OrderHeader";
import FilterPanel from "@/components/Orders/FilterPanel";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import SortControls from "@/components/Orders/SortControls";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToastContainer } from "react-toastify";
import useOrders from "@/hooks/useOrders";
import { useSearchParams } from "react-router-dom";
import debounce from "lodash.debounce";
import { Button } from "@/components/ui/button";
import StatusDialog from "@/components/Orders/StatusDialog";

export default function OrdersPage() {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  const [searchParams, setSearchParams] = useSearchParams();
  const params = new URLSearchParams(searchParams);
  const page = parseInt(params.get("page") || "1", 10);
  const pageSize = parseInt(params.get("limit") || "10", 10);
  const sortBy = params.get("sortBy") || "createdAt";
  const sortDirection = params.get("sortDirection") || "desc";
  const searchQuery = searchParams.get("search") || "";
  const status = params.get("status") && params.get("status");
  const paymentStatus =
    params.get("paymentStatus") && params.get("paymentStatus");
  const fulfillmentStatus =
    params.get("fulfillmentStatus") && params.get("fulfillmentStatus");

  const { data } = useOrders({
    page,
    pageSize,
    sortBy,
    sortDirection,
    searchQuery,
    status,
    paymentStatus,
    fulfillmentStatus,
  });

  const orders = data?.data;
  const pagination = data?.pagination || {};

  const handlePageChange = (newPage) => {
    params.set("page", newPage);
    setSearchParams(params);
  };

  const handlePageSizeChange = (newPageSize) => {
    params.set("page", 1);
    params.set("limit", newPageSize);
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    params.delete("status");
    params.delete("paymentStatus");
    params.delete("fulfillmentStatus");
    setSearchParams(params);
    setActiveFilters({});
  };

  const clearSearch = () => {
    searchParams.delete("search");
    setSearchParams(searchParams);
  };

  const debouncedSearch = debounce((query) => {
    if (query) {
      searchParams.set("search", query);
      setSearchParams(searchParams);
    } else {
      clearSearch();
    }
  }, 300);

  const onSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleFilterChange = (filters) => {
    const params = new URLSearchParams(searchParams); // start from current params

    const filterKeys = ["status", "paymentStatus", "fulfillmentStatus"];

    filterKeys.forEach((key) => {
      const value = filters[key];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else {
        params.set(key, Array.isArray(value) ? value.join(",") : value);
      }
    });

    params.set("page", "1");

    setActiveFilters(filters);
    setSearchParams(params);
  };

  const removeFilter = (type) => {
    const updatedFilters = { ...activeFilters };

    delete updatedFilters[type];

    setActiveFilters(updatedFilters);

    updateUrlParams(updatedFilters);
  };

  const updateUrlParams = (filters) => {
    Object.entries(filters).forEach(([type, values]) => {
      params.set(type, values.join(","));
    });
    setSearchParams(params);
  };

  const handleSortChange = (field, direction) => {
    params.set("sortBy", field);
    params.set("sortDirection", direction);
    params.set("page", 1);
    setSearchParams(params);
  };

  useEffect(() => {
    if (showStatus) {
      setShowFilters(false);
    }
  }, [showStatus]);

  const filterSections = [
    {
      id: "status",
      label: "Status",
      options: [
        { id: "Pending", label: "Pending" },
        { id: "Confirmed", label: "Confirmed" },
        { id: "Completed", label: "Completed" },
        { id: "Cancelled", label: "Cancelled" },
      ],
    },
    {
      id: "paymentStatus",
      label: "Payment status",
      options: [
        { id: "Unpaid", label: "Unpaid" },
        { id: "Paid", label: "Paid" },
        { id: "Confirming Payment", label: "Confirming Payment" },
        { id: "Partially Paid", label: "Partially Paid" },
        { id: "Refunded", label: "Refunded" },
      ],
    },
    {
      id: "fulfillmentStatus",
      label: "Fulfillment status",
      options: [
        { id: "Unfulfilled", label: "Unfulfilled" },
        { id: "Ready", label: "Ready" },
        { id: "Out For Delivery", label: "Out For Delivery" },
        { id: "Fulfilled", label: "Fulfilled" },
      ],
    },
    // {
    //   id: "delivery",
    //   label: "Delivery",
    //   options: [
    //     { id: "kg", label: "KG" },
    //     { id: "bhm", label: "BHM" },
    //   ],
    // },
  ];
  const getFilterLabel = (type, values) => {
    const labelMap = {
      status: "Status",
      paymentStatus: "Payment",
      fulfillmentStatus: "Fulfillment",
    };

    // Default to type name if not in labelMap
    const typeLabel = labelMap[type] || type;

    // Join the array of values into a comma-separated string
    const valuesLabel = values.join(", ");

    return `${typeLabel}: ${valuesLabel}`;
  };

  console.log(orders);
  return (
    <div className="flex flex-col gap-6 p-6">
      <OrdersHeader />

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-2xl">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by customer, product, order number or phone"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setShowFilters(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Filter size={20} />
            </button>
            <Popover>
              <PopoverTrigger className="text-gray-600 hover:bg-gray-100 rounded-lg">
                <ArrowUpDown size={20} />
              </PopoverTrigger>
              <PopoverContent className="w-fit p-0 -ml-[120px]">
                <SortControls
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                />
              </PopoverContent>
            </Popover>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            <Download size={20} />
            <span className="font-medium">Export</span>
          </button>
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
            Summary
          </button>
        </div>
      </div>

      {Object.keys(activeFilters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([type, values]) => (
            <div key={type}>
              <Badge variant="secondary" className="flex items-center gap-1">
                {getFilterLabel(type, values)}
                <button
                  onClick={() => removeFilter(type)}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </Badge>
            </div>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        </div>
      )}

      <OrderList
        orders={orders}
        selectedOrders={selectedOrders}
        onSelectOrders={setSelectedOrders}
        onShowStatus={() => setShowStatus(true)}
        page={page}
        pageSize={pageSize}
        totalOrders={pagination?.totalOrders}
        totalPages={pagination?.totalPages}
        hasPreviousPage={pagination?.hasPreviousPage}
        hasNextPage={pagination?.hasNextPage}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onClearFilters={clearAllFilters}
        onFiltersChange={handleFilterChange}
        activeFilters={activeFilters}
        filterSections={filterSections}
      />

      <StatusDialog
        orders={orders}
        selectedOrders={selectedOrders}
        onSelectOrders={setSelectedOrders}
        open={showStatus}
        onOpenChange={() => setShowStatus(false)}
      />

      <ToastContainer />
    </div>
  );
}
