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
import { Minus, Trash } from "lucide-react";
import useCustomerActions from "@/hooks/useCustomerActions";
// import InitialLoading from "../InitialLoading";
import { Link } from "react-router-dom";
import { showToast } from "@/components/NewToaster";

export default function CustomerList({
  customers,
  selectedCustomers,
  onSelectCustomers,
  page,
  pageSize,
  totalCustomers,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
  onPageSizeChange,
}) {
  const { deleteMutation } = useCustomerActions(onSelectCustomers);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({ selectedCustomers, isBulkDelete: true });
    showToast({
      title: "Successfully deleted customers",
      type: "success",
    });
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      onSelectCustomers([]);
    } else {
      onSelectCustomers(customers.map((p) => p._id));
    }
  };

  const toggleSelectProduct = (id) => {
    if (selectedCustomers.includes(id)) {
      onSelectCustomers(selectedCustomers.filter((p) => p !== id));
    } else {
      onSelectCustomers([...selectedCustomers, id]);
    }
  };

  const pages = Number(page) || 1;
  const pageSizes = Number(pageSize) || 10;
  const totalCustomer = Number(totalCustomers) || 0;
  const startIndex = (pages - 1) * pageSizes + 1;
  const endIndex = Math.min(pages * pageSizes, totalCustomer);

  // if (isPending) {
  //   return <InitialLoading />;
  // }

  return (
    <div className="bg-white border border-gray-200 overflow-hidden rounded-xl">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left">
              <div className="px-6 py-3 flex items-center gap-2 h-[52px]">
                <div className="relative">
                  <Checkbox
                    checked={
                      customers.length > 0 &&
                      selectedCustomers.length === customers?.length
                    }
                    onCheckedChange={toggleSelectAll}
                    className={`peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-gray-300 ${
                      selectedCustomers.length > 0 &&
                      !selectedCustomers.length !== customers?.length
                        ? "bg-blue-500 border-blue-500"
                        : ""
                    }`}
                  />
                  {selectedCustomers.length > 0 &&
                    selectedCustomers.length !== customers?.length && (
                      <Minus className="h-3 w-3 absolute top-[5px] left-[2px] text-white bg-blue-500 pointer-events-none" />
                    )}
                </div>
                {selectedCustomers.length > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions({selectedCustomers.length} selected)
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={handleDelete}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <span className="text-sm font-medium text-gray-700">
                    Customers
                  </span>
                )}
              </div>
            </th>
            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {!!customers &&
            customers.map((customer) => (
              <tr key={customer._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 w-2/3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedCustomers.includes(customer._id)}
                      onCheckedChange={() => toggleSelectProduct(customer._id)}
                      className="peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-gray-300"
                    />
                    <Link
                      to={`/customers/${customer._id}`}
                      className="block w-full"
                    >
                      <p className="font-medium">{customer.name}</p>
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4 w-1/3">
                  <div className="flex items-center justify-end space-x-6">
                    <p className="text-sm text-gray-400">
                      {customer.deliveryAddress.apartment}
                    </p>
                    <p className="text-sm text-gray-400">{customer.phone}</p>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <div
        className={`flex items-center ${
          customers.length > 0 ? "justify-between" : "justify-center"
        } px-6 py-4 border-t border-gray-200`}
      >
        {customers.length > 0 ? (
          <div className="w-full flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {startIndex} to {endIndex} of {totalCustomer} products
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
          <p className="text-sm text-gray-500">No Customers found.</p>
        )}
      </div>
    </div>
  );
}
