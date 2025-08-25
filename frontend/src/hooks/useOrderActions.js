import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { useSelector } from "react-redux";

const updateBulkOrdersStatus = async (orderIds, status, storeId) => {
  const res = await axios.post(`/api/stores/${storeId}/orders/bulk-update`, {
    orderIds,
    ...status,
  });
  return res.data;
};

const bulkDeleteOrders = async (orderIds, storeId) => {
  const res = await axios.post(`/api/stores/${storeId}/orders/bulk-delete`, {
    orderIds,
  });
  return res.data;
};

const useOrderActions = (onSelectOrders) => {
  const queryClient = useQueryClient();
  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ selectedOrders, activeStatus }) => {
      if (Array.isArray(selectedOrders) && selectedOrders.length > 0) {
        console.log("Using bulk update for:", selectedOrders);
        return await updateBulkOrdersStatus(
          selectedOrders,
          activeStatus,
          storeId
        );
      } else {
        throw new Error("No valid order(s) provided");
      }
    },
    onSuccess: (result, variables, context) => {
      queryClient.invalidateQueries(["orders"]);

      if (variables?.isBulkUpdate) {
        const count = variables.selectedOrders.length;
        onSelectOrders([]);
      }
    },
    onError: (error) => {
      console.error("Updating order status failed:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ selectedOrders }) => {
      if (Array.isArray(selectedOrders) && selectedOrders.length > 0) {
        console.log("Using bulk delete for:", selectedOrders);
        return await bulkDeleteOrders(selectedOrders, storeId);
      } else {
        throw new Error("No valid order(s) provided");
      }
    },
    onSuccess: (result, variables, context) => {
      if (variables?.isBulkDelete) {
        const count = variables.selectedOrders.length;
        onSelectOrders([]);
        queryClient.invalidateQueries(["orders"]);
      }
    },
    onError: (error) => {
      console.error("Deleting orders failed:", error);
    },
  });
  return { updateStatusMutation, deleteMutation };
};

export default useOrderActions;
