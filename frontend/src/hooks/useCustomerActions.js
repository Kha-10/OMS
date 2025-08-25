import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { useSelector } from "react-redux";

const deleteCustomers = async (ids, storeId) => {
  const res = await axios.post(`/api/stores/${storeId}/customers/bulk-delete`, {
    ids,
  });
  return res.data;
};

const useCustomerActions = (onSelectCustomers) => {
  const queryClient = useQueryClient();
  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;

  const deleteMutation = useMutation({
    mutationFn: async ({ selectedCustomers }) => {
      if (Array.isArray(selectedCustomers) && selectedCustomers.length > 0) {
        console.log("Using bulk delete for:", selectedCustomers);
        return await deleteCustomers(selectedCustomers, storeId);
      } else {
        throw new Error("No valid order(s) provided");
      }
    },
    // onSuccess: () => {
    //   queryClient.invalidateQueries(["customers"]);
    //   onSelectCustomers([]);
    // },
    onSuccess: (result, variables, context) => {
      queryClient.invalidateQueries(["customers"]);

      if (variables?.isBulkDelete) {
        onSelectCustomers([]);
      }
    },
    onError: (error) => {
      console.error("Deleting customers failed:", error);
    },
  });

  return {
    deleteMutation,
  };
};

export default useCustomerActions;
