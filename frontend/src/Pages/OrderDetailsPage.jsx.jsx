import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Printer,
  MoreHorizontal,
  ExternalLink,
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
import { useParams, Link } from "react-router-dom";
import useOrders from "@/hooks/useOrders";
import { format, parseISO } from "date-fns";
import StatusBadge from "@/components/StatusBadge";
import useOrderActions from "@/hooks/useOrderActions";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";

export default function OrderDetailsPage() {
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

  const total = orders?.items?.reduce((sum, item) => sum + item.totalPrice, 0);

  const totalQuantity = orders?.items?.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const changeStatus = (status) => {
    const orderIdsWithTracking = orders?.items
      ?.filter((item) => item.trackQuantityEnabled && item.productId !== null)
      .map((item) => item._id);

    const requiresInventoryAction = orderIdsWithTracking.length > 0;
    if (status.orderStatus === "Cancelled") {
      if (requiresInventoryAction) {
        const shouldRestock = confirm("Restock the inventory?");
        if (shouldRestock) {
          status.shouldRestock = true;
        }
      }
      console.log(status);
      updateStatusMutation.mutate({ selectedOrders: orders, data: status });
    } else {
      if (requiresInventoryAction) {
        const shouldDeduct = confirm("Deduct the inventory?");
        if (shouldDeduct) {
          status.shouldDeduct = true;
        }
      }
      console.log(status);
      updateStatusMutation.mutate({ selectedOrders: orders, data: status });
    }
  };

  const deleteOrders = () => {
    let data = {};
    const shouldDelete = confirm("Delete an order?");
    if (!shouldDelete) return;

    const hasNullProductId = orders?.items?.some(
      (item) => item.productId === null
    );

    if (!hasNullProductId) {
      const shouldRestock = confirm("Restock the inventory?");
      if (shouldRestock) {
        data.shouldRestock = true;
      }
    }
    deleteMutation.mutate({ selectedOrders: orders, data });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        {/* Top navigation */}
        <header className="max-w-5xl md:px-6 xl:px-0 px-4 py-3 flex items-center justify-between xl:ml-[46px] relative">
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
            <div className="rounded-lg hidden sm:flex bg-gray-200 hover:bg-gray-200 text-gray-700">
              <Button
                variant="ghost"
                className="rounded-r-none border border-gray-200"
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
                    onClick={() => navigate(`/addToCart/${orders._id}`)}
                    className="flex items-center w-full text-left text-sm text-gray-500 hover:bg-gray-100"
                  >
                    <Edit className="mr-3 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={deleteOrders}
                    className="flex items-center w-full text-left  text-sm text-red-500 hover:bg-gray-100"
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
        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          <div className="w-full max-w-5xl mx-auto">
            {/* Order header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 md:mb-6">
              <div className="p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium">
                      #{orders?.orderNumber}
                    </h2>
                    <Link to={`/${tenant.name}/orders/${orders?._id}`}>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </Link>
                  </div>
                  {orders?.createdAt && (
                    <p className="text-gray-500 text-sm">
                      {format(
                        new Date(orders.createdAt),
                        "dd MMMM yyyy, h:mm a"
                      )}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
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
                        {["Pending", "Confirmed", "Completed", "Cancelled"].map(
                          (status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() =>
                                changeStatus({
                                  orderStatus: status,
                                  paymentStatus: orders?.paymentStatus,
                                  fulfillmentStatus: orders?.fulfillmentStatus,
                                })
                              }
                            >
                              {status}
                            </DropdownMenuItem>
                          )
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            {/* Order details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="col-span-1 lg:col-span-2">
                {/* Items */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 md:mb-6">
                  <div className="p-3 sm:p-4">
                    <h3 className="font-medium">Items</h3>
                  </div>
                  {/* Items list */}
                  {orders?.items?.length > 0 &&
                    orders?.items.map((item, i) => (
                      <div key={item._id} className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row justify-between mb-2 gap-2 sm:gap-0">
                          <div>
                            {item.productId && (
                              <Link
                                to={`/products/${item.productId}`}
                                className="text-blue-500"
                              >
                                {item.productName}{" "}
                                {/* {item.selectedVariant.length > 0 && (
                                  <span>{item.selectedVariant[0].name}</span>
                                )} */}
                              </Link>
                            )}

                            <p className="text-gray-600">
                              ${item.basePrice} × {item.quantity}
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
                                        <span key={i}>(${price})</span>
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
                            ${item.totalPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}

                  <div className="border-t border-gray-200 p-3 sm:p-4">
                    <div className="flex justify-between mb-2">
                      <p>Items total ({totalQuantity})</p>
                      <p>${total?.toFixed(2)}</p>
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
                          <p>${amount.toFixed(2)}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-dashed  border-gray-200 p-3 sm:p-4">
                    <div className="flex justify-between mb-2">
                      <p>Subtotal</p>
                      <p>${orders?.pricing?.subtotal?.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="border-t border-dashed  border-gray-200 p-3 sm:p-4">
                    <div className="flex justify-between mb-2">
                      <p className="font-bold">Total</p>
                      <p className="font-bold">
                        {orders?.pricing?.finalTotal?.toFixed(2)}
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
                                orderStatus: orders?.status,
                                paymentStatus: "Paid",
                                fulfillmentStatus: orders?.fulfillmentStatus,
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
                                  orderStatus: orders?.status,
                                  paymentStatus: "Unpaid",
                                  fulfillmentStatus: orders?.fulfillmentStatus,
                                });
                              }}
                            >
                              Unpaid
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                changeStatus({
                                  orderStatus: orders?.status,
                                  paymentStatus: "Paid",
                                  fulfillmentStatus: orders?.fulfillmentStatus,
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
                                  orderStatus: orders?.status,
                                  paymentStatus: "Refunded",
                                  fulfillmentStatus: orders?.fulfillmentStatus,
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
                            ${adj.value.toFixed(2)}
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
                              orderStatus: orders?.status,
                              paymentStatus: orders?.paymentStatus,
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
                                  orderStatus: orders?.status,
                                  paymentStatus: orders?.paymentStatus,
                                  fulfillmentStatus: "Unfulfilled",
                                });
                              }}
                            >
                              Unfulfilled
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                changeStatus({
                                  orderStatus: orders?.status,
                                  paymentStatus: orders?.paymentStatus,
                                  fulfillmentStatus: "Ready",
                                });
                              }}
                            >
                              Ready
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                changeStatus({
                                  orderStatus: orders?.status,
                                  paymentStatus: orders?.paymentStatus,
                                  fulfillmentStatus: "Out For Delivery",
                                });
                              }}
                            >
                              Out for delivery
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                changeStatus({
                                  orderStatus: orders?.status,
                                  paymentStatus: orders?.paymentStatus,
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
                      <div className="flex justify-between mb-2">
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
      <ToastContainer />
    </div>
  );
}
