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
  const [orderStatus, setOrderStatus] = useState(initialOrderStatus);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [fulfillmentStatus, setFulfillmentStatus] = useState(
    initialFulfillmentStatus
  );

  const { updateStatusMutation } = useOrderActions(onSelectOrders);

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

  const handleSave = () => {
    const data = {
      orderStatus,
      paymentStatus,
      fulfillmentStatus,
    };

    const ordersWithTracking = selectedOrders
      .map((id) => orders.find((order) => order._id === id))
      .filter((order) =>
        order?.items?.some(
          (item) => item.trackQuantityEnabled && item.productId !== null
        )
      );

    const requiresInventoryAction = ordersWithTracking.length > 0;

    if (data.orderStatus === "Cancelled") {
      if (requiresInventoryAction) {
        const shouldRestock = confirm("Restock the inventory?");
        if (shouldRestock) {
          data.shouldRestock = true;
        }
      }

      updateStatusMutation.mutate({ selectedOrders, data });
      onOpenChange(false);
    } else {
      if (requiresInventoryAction) {
        const shouldDeduct = confirm("Deduct the inventory?");
        if (shouldDeduct) {
          data.shouldDeduct = true;
        }
      }

      updateStatusMutation.mutate({ selectedOrders, data });
      onOpenChange(false);
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
              <RadioGroup value={orderStatus} onValueChange={setOrderStatus}>
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
                onValueChange={setPaymentStatus}
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
                onValueChange={setFulfillmentStatus}
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
    </Dialog>
  );
}
