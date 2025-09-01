import { useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Printer,
  MoreHorizontal,
  Edit,
  Trash2,
  MessageCircle,
  Truck,
  CircleUser,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useParams, Link, useNavigationType } from "react-router-dom";
import useOrders from "@/hooks/useOrders";
import { format, parseISO } from "date-fns";
import StatusBadge from "@/components/StatusBadge";
import useOrderActions from "@/hooks/useOrderActions";
import { useNavigate } from "react-router-dom";
import axios from "@/helper/axios";
import { useSelector, useDispatch } from "react-redux";
import { discardCart } from "@/features/cart/cartSlice";
import { showToast } from "@/components/NewToaster";
import { formatWithCurrency } from "@/helper/currencyCoverter";

export default function OrderDetailsPage({currency}) {
  const { tenant } = useSelector((state) => state.tenants);
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isPending } = useOrders(
    { id },
    {
      enabled: !!id,
    }
  );
  const orders = data;
  console.log("orders", orders);

  const { updateStatusMutation, deleteMutation } = useOrderActions(null, () =>
    navigate("/orders")
  );

  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;
  const navigationType = useNavigationType();
  const dispatch = useDispatch();

  useEffect(() => {
    if (navigationType === "POP") {
      dispatch(discardCart(storeId));
    }
  }, [navigationType]);

  const total = orders?.items?.reduce((sum, item) => sum + item.totalPrice, 0);

  const totalQuantity = orders?.items?.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const changeStatus = async (status) => {
    const skipValues = [
      "Pending",
      "Completed",
      "Confirmed",
      "Paid",
      "Unpaid",
      "Confirming Payment",
      "Partially Paid",
      "Refunded",
      "Unfulfilled",
      "Fulfilled",
      "Ready",
      "Out For Delivery",
    ];

    const [key] = Object.keys(status); // "orderStatus" | "paymentStatus" | "fulfillmentStatus"
    const newStatus = status[key];

    const orderIdsWithTracking = orders?.items?.filter(
      (item) => item.trackQuantityEnabled && item.productId !== null
    );

    const requiresInventoryAction = orderIdsWithTracking.length > 0;
    try {
      await updateStatusMutation.mutateAsync({
        selectedOrders: [orders._id],
        activeStatus: status,
      });
      showToast({
        title: "Successfully updated orders",
        type: "success",
      });

      const oldStatus = orders?.[key];
      // ✅ 1. Restock inventory if orderStatus becomes Cancelled
      if (key === "orderStatus" && oldStatus === "Cancelled") {
        if (requiresInventoryAction) {
          const confirmDeduct = confirm("Deduct the inventory?");
          if (confirmDeduct) {
            console.log(`Called deduct API for order ${orders._id}`);
            try {
              let res = await axios.post(
                `/api/stores/${storeId}/orders/deduct`,
                orders
              );
              if (res.status === 200) {
                showToast({
                  title: "Successfully deducted the inventory",
                  type: "success",
                });
              }
            } catch (invErr) {
              console.error("Deduction failed:", invErr);
              showToast({
                title: "Failed to deduct inventory",
                type: "error",
              });
            }
          }
        }
      }
      if (key === "orderStatus" && newStatus === "Cancelled") {
        if (requiresInventoryAction) {
          const confirmDeduct = confirm("Restock the inventory?");
          if (confirmDeduct) {
            console.log(`Called restock API for order ${orders._id}`);
            try {
              let res = await axios.post(
                `/api/stores/${storeId}/orders/restock`,
                orders
              );
              if (res.status === 200) {
                showToast({
                  title: "Successfully restocked inventory",
                  type: "success",
                });
              }
            } catch (invErr) {
              console.error("Restock failed:", invErr);
              showToast({
                title: "Failed to restock the inventory",
                type: "error",
              });
            }
          }
        }
      }

      // ✅ 2. Refund if value is Refunded
      if (
        key === "paymentStatus" &&
        newStatus === "Refunded" &&
        oldStatus === "Paid"
      ) {
        console.log(`Called refund API for order ${orders._id}`);
        // await callRefundAPI(order._id);
        try {
          let res = await axios.post(
            `/api/stores/${storeId}/orders/refund`,
            orders
          );
          if (res.status === 200) {
            showToast({
              title: "Successfully refunded",
              type: "success",
            });
          }
        } catch (invErr) {
          console.error("Restock failed:", invErr);
          showToast({
            title: "Failed to refund",
            type: "error",
          });
        }
      }
      if (key === "paymentStatus" && newStatus === "Paid") {
        console.log(`Called pay API for order ${orders._id}`);
        // await callPayAPI(order._id);
        try {
          let res = await axios.post(
            `/api/stores/${storeId}/orders/pay`,
            orders
          );
          if (res.status === 200) {
            showToast({
              title: "Successfully Paid",
              type: "success",
            });
          }
        } catch (invErr) {
          console.error("Restock failed:", invErr);
          showToast({
            title: "Failed to pay",
            type: "error",
          });
        }
      }

      if (key === "orderStatus") {
        const shouldDeduct =
          !skipValues.includes(oldStatus) && !skipValues.includes(newStatus);

        if (requiresInventoryAction && shouldDeduct) {
          const confirmDeduct = confirm("Deduct the inventory?");
          if (confirmDeduct) {
            try {
              let res = await axios.post(
                `/api/stores/${storeId}/orders/deduct`,
                orders
              );
              if (res.status === 200) {
                showToast({
                  title: "Successfully deducted",
                  type: "success",
                });
              }
            } catch (invErr) {
              console.error("Deduction failed:", invErr);
              showToast({
                title: "Failed to deduct inventory",
                type: "error",
              });
            }
          }
        }
      }
    } catch (error) {
      showToast({
        title: "Failed to update orders",
        type: "error",
      });
    }
  };

  const deleteOrders = async () => {
    const orderIdsWithTracking = orders?.items?.filter(
      (item) => item.trackQuantityEnabled && item.productId !== null
    );

    const requiresInventoryAction = orderIdsWithTracking.length > 0;
    try {
      // ✅ Await the delete mutation
      await deleteMutation.mutateAsync(
        { selectedOrders: [orders._id] },
        {
          onSuccess: () => {
            navigate("/orders");
          },
        }
      );
      showToast({
        title: "Successfully deleted orders",
        type: "success",
      });

      // ✅ 1. Restock inventory if orderStatus becomes Cancelled
      if (requiresInventoryAction) {
        const confirmRestock = confirm("Restock the inventory?");
        if (confirmRestock) {
          console.log(`Called restock API for order ${orders._id}`);
          try {
            let res = await axios.post(
              `/api/stores/${storeId}/orders/restock`,
              orders
            );
            if (res.status === 200) {
              showToast({
                title: "Successfully restocked",
                type: "success",
              });
            }
          } catch (invErr) {
            console.error("Restock failed:", invErr);
            showToast({
              title: "Failed to restock inventory",
              type: "error",
            });
          }
        }
      }
    } catch (error) {
      showToast({
        title: "Failed to delete orders",
        type: "error",
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 p-6 md:p-0">
      <div className="flex-1 flex flex-col">
        {/* Top navigation */}
        <header className="max-w-5xl md:px-6 xl:px-0 px-4  flex items-center justify-between xl:ml-[46px] relative">
          <div className="flex items-center gap-2">
            <ChevronLeft
              className="w-5 h-5 text-gray-500 cursor-pointer"
              onClick={() => window.history.back()}
            />
            <h1 className="text-xl font-bold">
              #{orders?.orderNumber} {orders?.customer?.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg flex bg-gray-200 hover:bg-gray-200 text-gray-700">
              <Button
                variant="ghost"
                className="rounded-r-none border border-gray-200"
                type="button"
                onClick={() => navigate(`/stores/${storeId}/invoice/${id}`)}
              >
                <Printer className="w-4 h-4" />
                <span className="hidden md:inline ml-2">Print</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-l-none rounded-r-md border border-gray-200"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="cursor-pointer">
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(`/stores/${storeId}/addToCart/${orders._id}`)
                    }
                    className="flex items-center w-full text-left text-sm text-gray-500 hover:bg-gray-100"
                  >
                    <Edit className="mr-3 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={deleteOrders}
                    className="flex items-center w-full text-left text-sm text-red-500 hover:bg-gray-100"
                  >
                    <Trash2 className="mr-3 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1">
          <div className="w-full max-w-5xl mx-auto">
            {/* Order header */}
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
              {orders?.createdAt && (
                <p className="text-gray-500 text-sm">
                  {format(new Date(orders.createdAt), "dd MMMM yyyy, h:mm a")}
                </p>
              )}
            </div>

            {/* Order details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="col-span-1 lg:col-span-2">
                {/* Items */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 md:mb-6">
                  <div className="p-3 sm:p-4 flex items-center justify-between">
                    <div className="font-medium w-full">Items</div>
                    <div className="flex items-center gap-2 w-full sm:w-auto text-right">
                      <div className="relative w-full sm:w-auto">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="bg-gray-200 hover:bg-gray-200 text-gray-700 border-gray-300"
                            >
                              {orders?.orderStatus}{" "}
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="z-50">
                            {[
                              "Pending",
                              "Confirmed",
                              "Completed",
                              "Cancelled",
                            ].map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() =>
                                  changeStatus({
                                    orderStatus: status,
                                    // paymentStatus: orders?.paymentStatus,
                                    // fulfillmentStatus:
                                    //   orders?.fulfillmentStatus,
                                  })
                                }
                              >
                                {status}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                  {/* Items list */}
                  {orders?.items?.length > 0 &&
                    orders?.items.map((item, i) => (
                      <div key={item._id} className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row justify-between mb-2 gap-2 sm:gap-0">
                          <div>
                            {item.productId && (
                              <Link
                                to={`/stores/${storeId}/products/${item.productId}`}
                                className="text-blue-500"
                              >
                                {item.productName}{" "}
                                {/* {item.selectedVariant.length > 0 && (
                                  <span>{item.selectedVariant[0].name}</span>
                                )} */}
                              </Link>
                            )}

                            <p className="text-gray-600">
                            {`${formatWithCurrency(item.basePrice, currency)} × ${item.quantity}`}
                            </p>
                            {item?.options?.length > 0 &&
                              item.options.map((opt) => {
                                return (
                                  <div
                                    key={opt._id}
                                    className="mt-1 flex items-center space-x-2"
                                  >
                                    <p className="text-gray-400 text-sm font-light">
                                      • {opt.name}:
                                    </p>
                                    <p className="text-gray-400 text-sm font-light ml-4">
                                      {opt.answers.map((ans, i) => (
                                        <span key={i}>{ans}</span>
                                      ))}
                                    </p>
                                    <p className="text-gray-400 text-sm font-light ml-4">
                                      {opt.prices.map((price, i) => (
                                        <span key={i}>{formatWithCurrency(price,currency)}</span>
                                      ))}
                                    </p>
                                    <p className="text-gray-400 text-sm font-light ml-4">
                                      {opt.quantities.map((quantity, i) => (
                                        <span key={i}>({quantity})</span>
                                      ))}
                                    </p>
                                  </div>
                                );
                              })}
                          </div>
                          <p className="font-medium">
                            {formatWithCurrency(item.totalPrice.toFixed(2),currency)}
                          </p>
                        </div>
                      </div>
                    ))}

                  <div className="border-t border-gray-200 p-3 sm:p-4">
                    <div className="flex justify-between mb-2">
                      <p>Items total ({totalQuantity})</p>
                      <p>{formatWithCurrency(total?.toFixed(2),currency)}</p>
                    </div>
                    {orders?.pricing?.adjustments.map((adj, index) => {
                      const subtotal = orders?.pricing?.subtotal || 0;
                      const amount = adj.isPercentage
                        ? (subtotal * adj.value) / 100
                        : adj.value;

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm font-normal"
                        >
                          <p>{adj.name}</p>
                          <p>{formatWithCurrency(amount.toFixed(2),currency)}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-dashed  border-gray-200 p-3 sm:p-4">
                    <div className="flex justify-between mb-2">
                      <p>Subtotal</p>
                      <p>{formatWithCurrency(orders?.pricing?.subtotal?.toFixed(2),currency)}</p>
                    </div>
                  </div>

                  <div className="border-t border-dashed  border-gray-200 p-3 sm:p-4">
                    <div className="flex justify-between mb-2">
                      <p className="font-bold">Total</p>
                      <p className="font-bold">
                        {formatWithCurrency(orders?.pricing?.finalTotal?.toFixed(2),currency)}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Payment info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4 md:mb-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                    <p className="font-medium">Payment</p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                      <StatusBadge status={orders?.paymentStatus} />
                      <div className="flex w-full sm:w-auto">
                        <Button
                          variant="outline"
                          className={`rounded-l-md bg-gray-200 rounded-r-none border-r-0 flex items-center gap-2 flex-1 sm:flex-auto ${
                            orders?.paymentStatus === "Paid"
                              ? "cursor-not-allowed opacity-30"
                              : ""
                          }`}
                          onClick={() => {
                            if (orders?.paymentStatus !== "Paid") {
                              changeStatus({
                                // orderStatus: orders?.status,
                                paymentStatus: "Paid",
                                // fulfillmentStatus: orders?.fulfillmentStatus,
                              });
                            }
                          }}
                        >
                          {orders?.paymentStatus === "Paid"
                            ? "Paid"
                            : "Mark as paid"}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="rounded-l-none rounded-r-md h-10 px-2 bg-gray-200"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                changeStatus({
                                  // orderStatus: orders?.status,
                                  paymentStatus: "Unpaid",
                                  // fulfillmentStatus: orders?.fulfillmentStatus,
                                });
                              }}
                            >
                              Unpaid
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                changeStatus({
                                  // orderStatus: orders?.status,
                                  paymentStatus: "Paid",
                                  // fulfillmentStatus: orders?.fulfillmentStatus,
                                });
                              }}
                            >
                              Paid
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                changeStatus({
                                  orderStatus: orders?.status,
                                  paymentStatus: "Confirming Payment",
                                  fulfillmentStatus: orders?.fulfillmentStatus,
                                });
                              }}
                            >
                              Confirming Payment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                changeStatus({
                                  // orderStatus: orders?.status,
                                  paymentStatus: "Refunded",
                                  // fulfillmentStatus: orders?.fulfillmentStatus,
                                });
                              }}
                            >
                              Refunded
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Fulfillment info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 md:mb-6">
                  <div className="p-3 sm:p-4 flex justify-between items-center">
                    <h3 className="font-medium text-lg">Fulfillment</h3>
                    <StatusBadge status={orders?.fulfillmentStatus} />
                  </div>

                  <div className="p-3 sm:p-4 border-t border-gray-200">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <div className="w-24 min-w-[6rem] text-gray-500 mb-1 sm:mb-0">
                          Name
                        </div>
                        <div className="font-medium">
                          {/* {orders?.customer?.name} */}
                          {orders?.customer
                            ? orders?.customer?.name
                            : orders?.manualCustomer?.name}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center">
                        <div className="w-24 min-w-[6rem] text-gray-500 mb-1 sm:mb-0">
                          Phone
                        </div>
                        <div className="text-blue-500">
                          {/* {orders?.customer?.phone} */}
                          {orders?.customer
                            ? orders?.customer?.phone
                            : orders?.manualCustomer?.phone}
                        </div>
                      </div>

                      {orders?.pricing?.adjustments
                        .filter((adj) => adj.type === "fee")
                        .map((adj) => (
                          <div
                            key={adj.__id}
                            className="flex flex-col sm:flex-row sm:items-center"
                          >
                            <div className="w-24 min-w-[6rem] text-gray-500 mb-1 sm:mb-0">
                              {adj.name}
                            </div>
                            {formatWithCurrency(adj.value.toFixed(2),currency)}
                          </div>
                        ))}

                      <div className="flex flex-col sm:flex-row sm:items-start">
                        <div className="w-24 min-w-[6rem] text-gray-500 mb-1 sm:mb-0">
                          Notes
                        </div>

                        <div className="flex flex-col gap-1 text-gray-400 font-light">
                          {orders?.notes?.length > 0
                            ? orders.notes.map((note) => (
                                <div
                                  key={note._id}
                                  className="flex flex-col gap-1"
                                >
                                  <span>{note.content}</span>
                                </div>
                              ))
                            : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <div className="flex">
                        <Button
                          variant="outline"
                          className={`rounded-l-md bg-gray-200 rounded-r-none border-r-0 flex items-center gap-2 ${
                            orders?.fulfillmentStatus === "Fulfilled"
                              ? "cursor-not-allowed opacity-30"
                              : ""
                          }`}
                          onClick={() => {
                            changeStatus({
                              // orderStatus: orders?.status,
                              // paymentStatus: orders?.paymentStatus,
                              fulfillmentStatus: "Fulfilled",
                            });
                          }}
                        >
                          <Truck className="w-5 h-5" />
                          {orders?.fulfillmentStatus === "Fulfilled"
                            ? "Fulfilled"
                            : "Mark as fulfilled"}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="rounded-l-none rounded-r-md h-10 px-2 bg-gray-200"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                changeStatus({
                                  // orderStatus: orders?.status,
                                  // paymentStatus: orders?.paymentStatus,
                                  fulfillmentStatus: "Unfulfilled",
                                });
                              }}
                            >
                              Unfulfilled
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                changeStatus({
                                  // orderStatus: orders?.status,
                                  // paymentStatus: orders?.paymentStatus,
                                  fulfillmentStatus: "Ready",
                                });
                              }}
                            >
                              Ready
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                changeStatus({
                                  // orderStatus: orders?.status,
                                  // paymentStatus: orders?.paymentStatus,
                                  fulfillmentStatus: "Out For Delivery",
                                });
                              }}
                            >
                              Out for delivery
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                changeStatus({
                                  // orderStatus: orders?.status,
                                  // paymentStatus: orders?.paymentStatus,
                                  fulfillmentStatus: "Fulfilled",
                                });
                              }}
                            >
                              Fulfilled
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {orders?.customer?.name && (
                <div className="col-span-1">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 md:mb-6">
                    <div className="p-3 sm:p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-gray-200 flex items-center justify-center">
                          <CircleUser className="h-5 w-5 text-gray-500" />
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {" "}
                            {orders?.customer?.name}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {orders?.customer?.phone}
                          </p>
                        </div>
                      </div>
                      <Link to={`/customers/${orders?.customer?._id}`}>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    </div>

                    <div className="border-t border-gray-200 px-3 py-2 sm:px-4 sm:py-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-gray-500">Member since</p>
                        <p className="text-sm">
                          {" "}
                          {orders?.customer?.createdAt
                            ? format(
                                parseISO(orders.customer.createdAt),
                                "dd MMMM yyyy, h:mm a"
                              )
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat button */}
      <div className="fixed bottom-6 right-6">
        <Button className="rounded-full h-14 w-14 bg-black hover:bg-gray-800">
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
