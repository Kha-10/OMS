import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { errorToast, successToast } from "@/helper/showToast";

const updateSingleOrderStatus = async (id, status) => {
  const res = await axios.patch(`/api/orders/${id}`, { ...status });
  return res.data;
};

const updateBulkOrdersStatus = async (orderIds, status) => {
  const res = await axios.post("/api/orders/bulk-update", {
    orderIds,
    ...status,
  });
  return res.data;
};

const deleteOrder = async (orderId, data) => {
  const res = await axios.delete(`/api/orders/${orderId}`, { data });
  return res.data;
};

const bulkDeleteOrders = async (orderIds, data) => {
  const res = await axios.post("/api/orders/bulk-delete", {
    orderIds,
    ...data,
  });
  return res.data;
};

const useOrderActions = (onSelectOrders, onSingleDeleteSuccess) => {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ selectedOrders, activeStatus }) => {
      console.log("selectedOrders", selectedOrders);
      console.log("data", activeStatus);
      if (Array.isArray(selectedOrders) && selectedOrders.length > 0) {
        console.log("Using bulk update for:", selectedOrders);
        return await updateBulkOrdersStatus(selectedOrders, activeStatus);
      } else if (selectedOrders && typeof selectedOrders === "object") {
        console.log("Using single update for:", selectedOrders);
        const orderId = selectedOrders._id;
        return await updateSingleOrderStatus(orderId, data);
      } else {
        throw new Error("No valid order(s) provided");
      }
    },
    onSuccess: (result, variables, context) => {
      console.log("Update operation successful:", result);
      queryClient.invalidateQueries(["orders"]);

      if (Array.isArray(variables?.selectedOrders)) {
        const count = variables.selectedOrders.length;
        successToast(`Successfully updated ${count} orders`);
        onSelectOrders([]);
      } else {
        successToast("Order status updated successfully");
      }
    },
    onError: (error) => {
      console.error("Updating order status failed:", error);
      errorToast(error.response.data.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ selectedOrders, data }) => {
      if (Array.isArray(selectedOrders) && selectedOrders.length > 0) {
        console.log("Using bulk delete for:", selectedOrders);
        return await bulkDeleteOrders(selectedOrders, data);
      } else if (selectedOrders && typeof selectedOrders === "object") {
        console.log("Using single delete for:", selectedOrders);
        const orderId = selectedOrders._id;
        return await deleteOrder(orderId, data);
      } else {
        throw new Error("No valid order(s) provided");
      }
    },
    onSuccess: (result, variables, context) => {
      console.log("Delete operation successful:", result);

      if (Array.isArray(variables?.selectedOrders)) {
        const count = variables.selectedOrders.length;
        successToast(`Successfully deleted ${count} orders`);
        onSelectOrders([]);
        queryClient.invalidateQueries(["orders"]);
      } else {
        onSingleDeleteSuccess?.();
        successToast("Order deleted successfully");
      }
    },
    onError: (error) => {
      console.error("Deleting orders failed:", error);
      errorToast(error.response.data.message);
    },
  });
  return { updateStatusMutation, deleteMutation };
};

export default useOrderActions;
