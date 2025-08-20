import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { useSelector } from "react-redux";

const duplicateProducts = async (ids, storeId) => {
  const res = await axios.post(`/api/stores/${storeId}/products/duplicate`, {
    ids: ids,
  });
  return res.data;
};

const deleteProducts = async (id) => {
  const res = await axios.delete(`/api/products/${id}`);
  return res.data;
};

const updateProductVisibility = async (
  selectedProducts,
  storeId,
  visibility
) => {
  const res = await axios.post(`/api/stores/${storeId}/products/visibility`, {
    ids: selectedProducts,
    visibility,
  });
  return res.data;
};

const useProductActions = (onSelectProducts) => {
  const queryClient = useQueryClient();
  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;

  const duplicateMutation = useMutation({
    // mutationFn: async (selectedProducts) => {
    //   const responses = await Promise.all(
    //     selectedProducts.map((id) => duplicateProducts(id))
    //   );
    //   return responses;
    // },
    mutationFn: async (selectedProducts) => {
      console.log(selectedProducts);
      if (Array.isArray(selectedProducts) && selectedProducts.length > 0) {
        console.log("Using bulk duplicate for:", selectedProducts);
        return await duplicateProducts(selectedProducts, storeId);
      } else {
        throw new Error("No valid product(s) provided");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      onSelectProducts([]);
    },
    onError: (error) => {
      console.error("Duplicating products failed:", error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (selectedProducts) => {
      const responses = await Promise.all(
        selectedProducts.map((id) => deleteProducts(id))
      );
      return responses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      onSelectProducts([]);
    },
    onError: (error) => {
      console.error("Deleting products failed:", error);
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ selectedProducts, visibility }) => {
      if (Array.isArray(selectedProducts) && selectedProducts.length > 0) {
        console.log("Using bulk update for:", selectedProducts);
        return await updateProductVisibility(
          selectedProducts,
          storeId,
          visibility
        );
      } else {
        throw new Error("No valid product(s) provided");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      onSelectProducts([]);
    },
    onError: (error, { visibility }) => {
      console.error(`Updating visibility to '${visibility}' failed:`, error);
    },
  });

  return { duplicateMutation, deleteMutation, updateVisibilityMutation };
};

export default useProductActions;
