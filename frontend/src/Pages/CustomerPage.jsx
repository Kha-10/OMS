import React, { useState, useMemo, useEffect } from "react";
import ProductsHeader from "@/components/Products/ProductsHeader";
import ProductsToolbar from "@/components/Products/ProductsToolbar";
import CustomerList from "@/components/Customers/CustomerList";
import FilterPanel from "@/components/Products/FilterPanel";
import Badges from "@/components/Products/Badges";
import { useSearchParams } from "react-router-dom";
import axios from "@/helper/axios";
import debounce from "lodash.debounce";
// import InitialLoading from "@/components/InitialLoading";
import ErrorMessage from "@/components/ErrorMessages";
import useCustomers from "@/hooks/useCustomers";

export default function CustomerPage() {
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const params = new URLSearchParams(searchParams);
  const page = parseInt(params.get("page") || "1", 10);
  const pageSize = parseInt(params.get("limit") || "10", 10);
  const sortBy = params.get("sortBy") || "createdAt";
  const sortDirection = params.get("sortDirection") || "desc";
  const searchQuery = searchParams.get("search") || "";

  const sorts = [
    { id: "createdAt", name: "Date" },
    { id: "totalSpent", name: "Total Spent" },
  ];

  const handlePageChange = (newPage) => {
    params.set("page", newPage);
    setSearchParams(params);
  };

  const handlePageSizeChange = (newPageSize) => {
    params.set("page", 1);
    params.set("limit", newPageSize);
    setSearchParams(params);
  };

  const { data, error } = useCustomers({
    page,
    pageSize,
    searchQuery,
    sortBy,
    sortDirection,
  });

  const customers = data?.data || [];
  const pagination = data?.pagination || {};
  const errorMessage = error?.response;

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

  if (errorMessage)
    return (
      <ErrorMessage
        title={errorMessage.data.message}
        code={errorMessage.status}
        action={{
          label: "Return to Dashboard",
          to: "/",
        }}
      />
    );

  return (
    <div className="p-6 space-y-6">
      <ProductsHeader header="Customers" buttonText="customers" />

      <ProductsToolbar
        text="Search by customer name"
        show={false}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        clearSearch={clearSearch}
        onShowFilters={() => setShowFilters(true)}
        sorts={sorts}
        sortBy={sortBy}
        sortDirection={sortDirection}
        params={params}
        setSearchParams={setSearchParams}
      />

      <CustomerList
        customers={customers}
        selectedCustomers={selectedCustomers}
        onSelectCustomers={setSelectedCustomers}
        page={page}
        pageSize={pageSize}
        totalCustomers={pagination?.totalCustomers}
        totalPages={pagination?.totalPages}
        hasPreviousPage={pagination?.hasPreviousPage}
        hasNextPage={pagination?.hasNextPage}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}
