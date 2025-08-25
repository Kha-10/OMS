import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  FileDown,
  Trash2,
  Minus,
  ChevronRight,
} from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";
import { format } from "date-fns";
import Pagination from "../Pagination";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../StatusBadge";
import useOrderActions from "@/hooks/useOrderActions";
import axios from "@/helper/axios";
import { ToastContainer, toast } from "react-toastify";
import { useSelector } from "react-redux";

export default function OrderList({
  orders,
  selectedOrders,
  onSelectOrders,
  onShowStatus,
  page,
  pageSize,
  totalOrders,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
  onPageSizeChange,
}) {
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  const { deleteMutation } = useOrderActions(onSelectOrders);

  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;

  const totalPages = Math.ceil(totalOrders / pageSize);
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalOrders);

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      onSelectOrders([]);
    } else {
      onSelectOrders(orders.map((order) => order._id));
    }
  };

  const toggleSelectOrder = (id) => {
    if (selectedOrders.includes(id)) {
      onSelectOrders(selectedOrders.filter((orderId) => orderId !== id));
    } else {
      onSelectOrders([...selectedOrders, id]);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        actionsMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setActionsMenuOpen(false);
      }
    }

    if (actionsMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [actionsMenuOpen]);

  const deleteOrders = async () => {
    const shouldDelete = confirm(
      `Delete ${
        selectedOrders.length > 1
          ? `${selectedOrders.length} orders`
          : "an order"
      }?`
    );
    if (!shouldDelete) return;

    // Find orders that require restocking
    const ordersWithTracking = selectedOrders
      .map((id) => orders.find((order) => order._id === id))
      .filter((order) =>
        order?.items?.some(
          (item) => item.trackQuantityEnabled && item.productId !== null
        )
      );

    try {
      // ✅ Await the delete mutation
      await deleteMutation.mutateAsync({ selectedOrders, isBulkDelete: true });

      toast.success("Successfully deleted orders", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
      });

      // Ask once for restocking
      if (ordersWithTracking.length > 0) {
        const confirmRestock = confirm(
          "Restock the inventory for all deleted orders?"
        );
        if (confirmRestock) {
          for (const order of ordersWithTracking) {
            try {
              const res = await axios.post(
                `/api/stores/${storeId}/orders/restock`,
                order
              );
              if (res.status === 200) {
                toast.success(`Restocked order ${order._id}`, {
                  position: "top-center",
                  autoClose: 5000,
                  hideProgressBar: true,
                  closeOnClick: true,
                });
              }
            } catch (invErr) {
              console.error("Restock failed:", invErr);
              toast.error(`Failed to restock order ${order._id}`, {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
              });
            }
          }
        }
      }
    } catch (error) {
      toast.error("Failed to delete orders", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
      });
    }
  };

  const navigateToOrder = (id) => {
    navigate(`/orders/${id}`);
  };

  return (
    <div className="bg-white border border-gray-200 overflow-x-auto rounded-xl">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-12 px-4 py-3">
              <div className="relative">
                <Checkbox
                  checked={
                    orders?.length > 0 &&
                    selectedOrders.length === orders?.length
                  }
                  onCheckedChange={toggleSelectAll}
                  className={`peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-gray-300 ${
                    selectedOrders.length > 0 &&
                    !selectedOrders.length !== orders?.length
                      ? "bg-blue-500 border-blue-500"
                      : ""
                  }`}
                />
                {selectedOrders.length > 0 &&
                  selectedOrders.length !== orders?.length && (
                    <Minus className="h-3 w-3 absolute top-[5px] left-[2px] text-white bg-blue-500 pointer-events-none" />
                  )}
              </div>
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 w-[200px]">
              <div className="flex items-center h-8">
                {selectedOrders.length > 0 ? (
                  <Button
                    ref={buttonRef}
                    variant="outline"
                    size="sm"
                    onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
                  >
                    Actions({selectedOrders.length} selected)
                  </Button>
                ) : (
                  <span>ID</span>
                )}
                {actionsMenuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute mt-[160px] ml-6 w-56 rounded-md shadow-lg text-black font-normal bg-white ring-1 ring-black ring-opacity-5 z-10"
                  >
                    <div
                      className="p-1"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <button
                        className="flex items-center w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                        role="menuitem"
                        onClick={() => {
                          setActionsMenuOpen(false);
                          onShowStatus();
                        }}
                      >
                        <CheckCircle className="mr-3 h-4 w-4" />
                        Change status
                      </button>
                      <button
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        <FileDown className="mr-3 h-4 w-4" />
                        Download PDF
                      </button>
                      <button
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
                        role="menuitem"
                        onClick={() => {
                          setActionsMenuOpen(false);
                          setTimeout(() => {
                            deleteOrders();
                          }, 0);
                        }}
                      >
                        <Trash2 className="mr-3 h-4 w-4" />
                        Delete orders
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium  text-gray-700">
              Date
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders?.length > 0 &&
            orders.map((order) => (
              <tr
                key={order._id}
                className="hover:bg-gray-50 cursor-pointer group"
                onClick={() => navigateToOrder(order._id)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedOrders.includes(order._id)}
                    onCheckedChange={() => toggleSelectOrder(order._id)}
                    className="peer data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 border-gray-300"
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                  <span className="mr-2"># {order.orderNumber}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order?.customer
                    ? order?.customer?.name
                    : order?.manualCustomer?.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {order.pricing?.finalTotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {format(order?.createdAt, "dd MMMM yyyy, h:mm a")}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex space-x-2">
                    <StatusBadge status={order.orderStatus} />
                    <StatusBadge status={order.paymentStatus} />
                    <StatusBadge status={order.fulfillmentStatus} />
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      <div
        className={`flex items-center ${
          orders?.length > 0 ? "justify-between" : "justify-center"
        } px-6 py-4 border-t border-gray-200`}
      >
        {orders?.length > 0 ? (
          <div className="w-full flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {startIndex} to {endIndex} of {totalOrders} orders
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
          <p className="text-sm text-gray-500">No Orders found.</p>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
