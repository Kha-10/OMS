import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useOrderActions from "@/hooks/useOrderActions";
import axios from "@/helper/axios";
import { ToastContainer, toast } from "react-toastify";
import { useSelector } from "react-redux";

export default function StatusDialog({
  orders,
  selectedOrders,
  onSelectOrders,
  open,
  onOpenChange,
  initialOrderStatus = "Pending",
  initialPaymentStatus = "Unpaid",
  initialFulfillmentStatus = "Unfulfilled",
}) {
  const [activeTab, setActiveTab] = useState("status");
  const [activeStatus, setActiveStatus] = useState({ orderStatus: "Pending" });
  const [orderStatus, setOrderStatus] = useState(initialOrderStatus);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [fulfillmentStatus, setFulfillmentStatus] = useState(
    initialFulfillmentStatus
  );

  const { updateStatusMutation } = useOrderActions(onSelectOrders);

  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;

  const orderStatusOptions = [
    {
      id: "pending",
      label: "Pending",
    },
    {
      id: "confirmed",
      label: "Confirmed",
    },
    {
      id: "completed",
      label: "Completed",
    },
    {
      id: "cancelled",
      label: "Cancelled",
    },
  ];

  const paymentStatusOptions = [
    {
      id: "unpaid",
      label: "Unpaid",
    },
    {
      id: "confirmingPayment",
      label: "Confirming Payment",
    },
    {
      id: "partiallyPaid",
      label: "Partially Paid",
    },
    {
      id: "paid",
      label: "Paid",
    },
    {
      id: "refunded",
      label: "Refunded",
    },
  ];

  const fulfillmentStatusOptions = [
    {
      id: "unfulfilled",
      label: "Unfulfilled",
    },
    {
      id: "ready",
      label: "Ready",
    },
    {
      id: "outForDelivery",
      label: "Out For Delivery",
    },
    {
      id: "fulfilled",
      label: "Fulfilled",
    },
  ];

  const handleSave = async () => {
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

    const [key] = Object.keys(activeStatus); // "orderStatus" | "paymentStatus" | "fulfillmentStatus"
    const newStatus = activeStatus[key];
    const ordersWithTracking = selectedOrders
      .map((id) => orders.find((order) => order._id === id))
      .filter((order) =>
        order?.items?.some(
          (item) => item.trackQuantityEnabled && item.productId !== null
        )
      );
    const requiresInventoryAction = ordersWithTracking.length > 0;

    // Save status change first
    updateStatusMutation.mutate({
      selectedOrders,
      activeStatus,
      isBulkUpdate: true,
    });
    onOpenChange(false);

    for (const order of ordersWithTracking) {
      const oldStatus = order?.[key];
      // ✅ 1. Restock inventory if orderStatus becomes Cancelled
      if (key === "orderStatus" && oldStatus === "Cancelled") {
        if (requiresInventoryAction) {
          const confirmDeduct = confirm("Deduct the inventory?");
          if (confirmDeduct) {
            console.log(`Called deduct API for order ${order._id}`);
            try {
              let res = await axios.post(
                `/api/stores/${storeId}/orders/deduct`,
                order
              );
              if (res.status === 200) {
                toast.success("Successfully deducted", {
                  position: "top-center",
                  autoClose: 5000,
                  hideProgressBar: true,
                  closeOnClick: true,
                });
              }
            } catch (invErr) {
              console.error("Deduction failed:", invErr);
              toast.error("Failed to deduct inventory", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
              });
            }
          }
        }
        continue; // Skip deduct/refund when restocking
      }
      if (key === "orderStatus" && newStatus === "Cancelled") {
        if (requiresInventoryAction) {
          const confirmRestock = confirm("Restock the inventory?");
          if (confirmRestock) {
            console.log(`Called restock API for order ${order._id}`);
            try {
              let res = await axios.post(
                `/api/stores/${storeId}/orders/restock`,
                order
              );
              if (res.status === 200) {
                toast.success("Successfully restocked", {
                  position: "top-center",
                  autoClose: 5000,
                  hideProgressBar: true,
                  closeOnClick: true,
                });
              }
            } catch (invErr) {
              console.error("Restock failed:", invErr);
              toast.error("Failed to restock inventory", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
              });
            }
          }
        }
        continue; // Skip deduct/refund when restocking
      }

      // ✅ 2. Refund if value is Refunded
      if (
        key === "paymentStatus" &&
        newStatus === "Refunded" &&
        oldStatus === "Paid"
      ) {
        console.log(`Called refund API for order ${order._id}`);
        // await callRefundAPI(order._id);
        try {
          let res = await axios.post(
            `/api/stores/${storeId}/orders/refund`,
            order
          );
          if (res.status === 200) {
            toast.success("Successfully refunded", {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: true,
              closeOnClick: true,
            });
          }
        } catch (invErr) {
          console.error("Restock failed:", invErr);
          toast.error("Failed to refund", {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
          });
        }
        continue; // Skip deduct if refunding
      }
      if (key === "paymentStatus" && newStatus === "Paid") {
        console.log(`Called pay API for order ${order._id}`);
        // await callPayAPI(order._id);
        try {
          let res = await axios.post(
            `/api/stores/${storeId}/orders/pay`,
            order
          );
          if (res.status === 200) {
            toast.success("Successfully Paid", {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: true,
              closeOnClick: true,
            });
          }
        } catch (invErr) {
          console.error("Restock failed:", invErr);
          toast.error("Failed to pay", {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
          });
        }
        continue; // Skip deduct if Paying
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
                order
              );
              if (res.status === 200) {
                toast.success("Successfully deducted", {
                  position: "top-center",
                  autoClose: 5000,
                  hideProgressBar: true,
                  closeOnClick: true,
                });
              }
            } catch (invErr) {
              console.error("Deduction failed:", invErr);
              toast.error("Failed to deduct inventory", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
              });
            }
          }
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change order status</DialogTitle>
          <DialogDescription className="sr-only hidden"></DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="payment">Payment status</TabsTrigger>
            <TabsTrigger value="fulfillment">Fulfillment status</TabsTrigger>
          </TabsList>

          {/* Order Status Tab */}
          <TabsContent value="status" className="pt-4">
            <div className="space-y-4">
              <div className="font-medium">Status</div>
              <RadioGroup
                value={orderStatus}
                onValueChange={(value) => {
                  setOrderStatus(value);
                  setActiveStatus({ orderStatus: value });
                }}
              >
                {orderStatusOptions.map(({ label, id }) => (
                  <div
                    key={id}
                    className="flex items-center justify-between space-x-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={label}
                        id={id}
                        className="h-5 w-5 border-[1.5px] border-gray-300 
                        before:h-2 before:w-2 before:bg-white
                        data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500
                        data-[state=checked]:before:bg-white text-white"
                      />
                      <label htmlFor={id} className="text-sm font-medium">
                        {label}
                      </label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="mt-6">
              <Button
                className="w-full px-4 py-2 bg-blue-500 text-white hover:bg-blue-700 rounded-lg font-medium"
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </TabsContent>

          {/* Payment Status Tab */}
          <TabsContent value="payment" className="pt-4">
            <div className="space-y-4">
              <div className="font-medium">Payment Status</div>
              <RadioGroup
                value={paymentStatus}
                onValueChange={(value) => {
                  setPaymentStatus(value);
                  setActiveStatus({ paymentStatus: value });
                }}
              >
                {paymentStatusOptions.map(({ label, id }) => (
                  <div
                    key={id}
                    className="flex items-center justify-between space-x-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={label}
                        id={id}
                        className="h-5 w-5 border-[1.5px] border-gray-300 
                        before:h-2 before:w-2 before:bg-white
                        data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500
                        data-[state=checked]:before:bg-white text-white"
                      />
                      <label htmlFor={id} className="text-sm font-medium">
                        {label}
                      </label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="mt-6">
              <Button
                className="w-full px-4 py-2 bg-blue-500 text-white hover:bg-blue-700 rounded-lg font-medium"
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </TabsContent>

          {/* Fulfillment Status Tab */}
          <TabsContent value="fulfillment" className="pt-4">
            <div className="space-y-4">
              <div className="font-medium">Fulfillment Status</div>
              <RadioGroup
                value={fulfillmentStatus}
                onValueChange={(value) => {
                  setFulfillmentStatus(value);
                  setActiveStatus({ fulfillmentStatus: value });
                }}
              >
                {fulfillmentStatusOptions.map(({ label, id }) => (
                  <div
                    key={id}
                    className="flex items-center justify-between space-x-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={label}
                        id={id}
                        className="h-5 w-5 border-[1.5px] border-gray-300 
                        before:h-2 before:w-2 before:bg-white
                        data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500
                        data-[state=checked]:before:bg-white text-white"
                      />
                      <label htmlFor={id} className="text-sm font-medium">
                        {label}
                      </label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="mt-6">
              <Button
                className="w-full px-4 py-2 bg-blue-500 text-white hover:bg-blue-700 rounded-lg font-medium"
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
      <ToastContainer />
    </Dialog>
  );
}
