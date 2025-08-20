import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { useSelector } from "react-redux";

const duplicateProducts = async (id) => {
  const res = await axios.post(`/api/products/${id}/duplicate`);
  return res.data;
};

const deleteProducts = async (id) => {
  const res = await axios.delete(`/api/products/${id}`);
  return res.data;
};

const updateProductVisibility = async (id, storeId, visibility) => {
  const res = await axios.patch(`/api/stores/${storeId}/products/${id}`, {
    visibility,
  });
  return res.data;
};

const useProductActions = (onSelectProducts) => {
  const queryClient = useQueryClient();
  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;

  const duplicateMutation = useMutation({
    mutationFn: async (selectedProducts) => {
      const responses = await Promise.all(
        selectedProducts.map((id) => duplicateProducts(id))
      );
      return responses;
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
      const responses = await Promise.all(
        selectedProducts.map((id) =>
          updateProductVisibility(id, storeId, visibility)
        )
      );
      return responses;
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
