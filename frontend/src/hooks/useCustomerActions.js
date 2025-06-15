import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { successToast, errorToast } from "@/helper/showToast";

const deleteSingleCustomer = async (id) => {
  const res = await axios.delete(`/api/customers/${id}`);
  return res.data;
};

const bulkDeleteCustomers = async (customerIds) => {
  const res = await axios.delete("/api/customers/bulk", {
    data: { ids: customerIds },
  });
  return res.data;
};

const useCustomerActions = (onSelectCustomers) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (selectedCustomers) => {
      if (selectedCustomers.length === 0) {
        throw new Error("No Customers selected");
      }

      if (selectedCustomers.length === 1) {
        console.log("Deleting single Customer:", selectedCustomers[0]);
        return await deleteSingleCustomer(selectedCustomers[0]);
      } else {
        console.log("Deleting multiple selectedCustomers:", selectedCustomers);
        return await bulkDeleteCustomers(selectedCustomers);
      }
    },
    onSuccess: (result, variables, context) => {
      console.log("Delete operation successful:", result);

      if (Array.isArray(variables?.selectedCustomers)) {
        const count = variables.selectedCustomers.length;
        successToast(`Successfully deleted ${count} Customers`);
        onSelectCustomers([]);
        queryClient.invalidateQueries(["customers"]);
      } else {
        successToast("Customers deleted successfully");
        queryClient.invalidateQueries(["customers"]);
        onSelectCustomers([]);
      }
    },
    onError: (error) => {
      console.error("Deleting Customers failed:", error);
      errorToast(error.response.data.message);
    },
  });

  return {
    deleteMutation,
  };
};

export default useCustomerActions;
