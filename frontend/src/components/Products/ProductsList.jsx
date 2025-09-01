import React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import Pagination from "../Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import { Minus } from "lucide-react";
import useProductActions from "@/hooks/useProductActions";
// import InitialLoading from "../InitialLoading";
import { Link, useParams } from "react-router-dom";

export default function ProductsList({
  products,
  selectedProducts,
  onSelectProducts,
  page,
  pageSize,
  totalProducts,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
  onPageSizeChange,
}) {
  const {
    duplicateMutation,
    deleteMutation,
    updateVisibilityMutation,
    isPending,
  } = useProductActions(onSelectProducts);

  const handleDuplicate = () => {
    console.log(selectedProducts);
    duplicateMutation.mutate(selectedProducts);
  };

  const handleDelete = () => {
    deleteMutation.mutate(selectedProducts);
  };

  const handleHide = () => {
    updateVisibilityMutation.mutate({ selectedProducts, visibility: "hidden" });
  };

  const handleShow = () => {
    updateVisibilityMutation.mutate({
      selectedProducts,
      visibility: "visible",
    });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      onSelectProducts([]);
    } else {
      onSelectProducts(products.map((p) => p._id));
    }
  };

  const toggleSelectProduct = (id) => {
    if (selectedProducts.includes(id)) {
      onSelectProducts(selectedProducts.filter((p) => p !== id));
    } else {
      onSelectProducts([...selectedProducts, id]);
    }
  };

  const pages = Number(page) || 1;
  const pageSizes = Number(pageSize) || 10;
  const totalProduct = Number(totalProducts) || 0;
  const startIndex = (pages - 1) * pageSizes + 1;
  const endIndex = Math.min(pages * pageSizes, totalProduct);

  const { storeId } = useParams();

  if (isPending) {
    return <InitialLoading />;
  }
  console.log(products);
  return (
    <div className="bg-white border border-gray-200 overflow-auto rounded-xl w-[295px] sm:max-w-2xl lg:max-w-7xl min-w-full">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left">
              <div className="px-6 py-3 flex items-center gap-2 h-[52px]">
                <div className="relative">
                  <Checkbox
                    checked={
                      products.length > 0 &&
                      selectedProducts.length === products?.length
                    }
                    onCheckedChange={toggleSelectAll}
                    className={`peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-gray-300 ${
                      selectedProducts.length > 0 &&
                      !selectedProducts.length !== products?.length
                        ? "bg-blue-500 border-blue-500"
                        : ""
                    }`}
                  />
                  {selectedProducts.length > 0 &&
                    selectedProducts.length !== products?.length && (
                      <Minus className="h-3 w-3 absolute top-[5px] left-[2px] text-white bg-blue-500 pointer-events-none" />
                    )}
                </div>
                {selectedProducts.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions({selectedProducts.length} selected)
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="-ml-[25px]">
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={handleDuplicate}
                      >
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={handleHide}
                      >
                        Hide
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={handleShow}
                      >
                        Show
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={handleDelete}
                      >
                        Delete products
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="text-sm font-medium text-gray-700">
                    Products
                  </span>
                )}
              </div>
            </th>
            <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {!!products &&
            products.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedProducts.includes(product._id)}
                      onCheckedChange={() => toggleSelectProduct(product._id)}
                      className="peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-gray-300"
                    />
                    <Link to={`/stores/${storeId}/products/${product._id}`}>
                      <div className="flex items-center gap-3">
                        {product.imgUrls.length > 0 && (
                          <img
                            src={product.imgUrls[0]}
                            className="w-[50px] h-[50px] rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p>{product.name}</p>
                          <div className="flex items-center gap-5 text-sm text-gray-500">
                            <span>
                              ฿
                              {(
                                product?.variants?.[0]?.price ??
                                product?.variants?.[0]?.originalPrice ??
                                product?.price ??
                                0
                              ).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            {product.categories.map((category) => (
                              <div key={category._id}>
                                <span>•</span>
                                <span>{category.name}</span>
                              </div>
                            ))}
                            {product.trackQuantityEnabled && (
                              <p className="text-sm text-gray-400">
                                {product.inventory.quantity > 0
                                  ? `${product.inventory.quantity} left`
                                  : "Sold out"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      product.visibility === "visible"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    )}
                  >
                    {product.visibility == "visible" ? "Visible" : "Hidden"}
                  </span>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <div
        className={`flex items-center ${
          products.length > 0 ? "justify-between" : "justify-center"
        } px-6 py-4 border-t border-gray-200`}
      >
        {products.length > 0 ? (
          <div className="w-full flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {startIndex} to {endIndex} of {totalProduct} products
            </div>
            <div className="flex items-center justify-between">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                hasPreviousPage={hasPreviousPage}
                hasNextPage={hasNextPage}
                onPageChange={onPageChange}
              />
              <Select
                value={String(pageSize)}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger className="w-[70px] h-10 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Select page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No Products found.</p>
        )}
      </div>
    </div>
  );
}
