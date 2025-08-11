import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/helper/axios";

const deleteCustomers = async (id) => {
    const res = await axios.delete(`/api/customers/${id}`);
    return res.data;
  };

const useCustomerActions = (onSelectCustomers) => {
    const queryClient = useQueryClient();
  
    const deleteMutation = useMutation({
        mutationFn: async (selectedCustomers) => {
          const responses = await Promise.all(
            selectedCustomers.map((id) => deleteCustomers(id))
          );
          return responses;
        },
        onSuccess: () => {
          queryClient.invalidateQueries(["customers"]);
          onSelectCustomers([]);
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
  