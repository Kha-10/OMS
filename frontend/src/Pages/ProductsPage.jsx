import React, { useState, useMemo, useEffect } from "react";
import ProductsHeader from "@/components/Products/ProductsHeader";
import ProductsToolbar from "@/components/Products/ProductsToolbar";
import ProductsList from "@/components/Products/ProductsList";
import FilterPanel from "@/components/Products/FilterPanel";
import Badges from "@/components/Products/Badges";
import { useSearchParams } from "react-router-dom";
import axios from "@/helper/axios";
import debounce from "lodash.debounce";
// import InitialLoading from "@/components/InitialLoading";
import ErrorMessage from "@/components/ErrorMessages";
import useProducts from "@/hooks/useProducts";

export default function ProductsPage() {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const params = new URLSearchParams(searchParams);
  const page = parseInt(params.get("page") || "1", 10);
  const pageSize = parseInt(params.get("limit") || "10", 10);
  const categories = params.get("categories") && params.get("categories");
  const visibility = params.get("visibility");
  const sortBy = params.get("sortBy") || "createdAt";
  const sortDirection = params.get("sortDirection") || "desc";
  const searchQuery = searchParams.get("search") || "";

  const { data, error } = useProducts({
    page,
    pageSize,
    categories,
    visibility,
    sortBy,
    sortDirection,
    searchQuery,
  });


  const products = data?.data || [];
  const pagination = data?.pagination || {};
  const errorMessage = error?.response;

  const sorts = [
    { id: "title", name: "title" },
    { id: "createdAt", name: "created" },
    { id: "updatedAt", name: "updated" },
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

  const clearAllFilters = () => {
    params.delete("categories");
    params.delete("visibility");
    setSearchParams(params);
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

  // if (isPending) {
  //   return <InitialLoading />;
  // }

  if (errorMessage)
    return (
      <ErrorMessage
        title={errorMessage.data.msg}
        code={errorMessage.status}
        action={{
          label: "Return to Dashboard",
          to: "/",
        }}
      />
    );

  return (
    <div className="p-6 space-y-6">
      <ProductsHeader header="Products" buttonText="products" context="new" />

      <ProductsToolbar
        text="Search by product,variant names or SKU "
        show={true}
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

      <Badges
        categories={categories}
        visibility={visibility}
        params={params}
        setSearchParams={setSearchParams}
      />

      <ProductsList
        products={products}
        selectedProducts={selectedProducts}
        onSelectProducts={setSelectedProducts}
        page={page}
        pageSize={pageSize}
        totalProducts={pagination?.totalProducts}
        totalPages={pagination?.totalPages}
        hasPreviousPage={pagination?.hasPreviousPage}
        hasNextPage={pagination?.hasNextPage}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        visibility={visibility}
        params={params}
        setSearchParams={setSearchParams}
        clearAllFilters={clearAllFilters}
      />
    </div>
  );
}
