import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { successToast, errorToast } from "@/helper/showToast";

const duplicateProducts = async (productIds) => {
  const res = await axios.post(`/api/products/duplicate`, {
    ids: productIds,
  });
  return res.data;
};

const deleteSingleProduct = async (id) => {
  const res = await axios.delete(`/api/products/${id}`);
  return res.data;
};

const bulkDeleteProducts = async (productIds) => {
  const res = await axios.delete("/api/products/bulk", {
    data: { ids: productIds },
  });
  return res.data;
};

const updateProductVisibility = async (id, visibility) => {
  const res = await axios.patch(`/api/products/${id}`, {
    visibility,
  });
  return res.data;
};

const useProductActions = (onSelectProducts) => {
  const queryClient = useQueryClient();

  const duplicateMutation = useMutation({
    // mutationFn: async (selectedProducts) => {
    //   const responses = await Promise.all(
    //     selectedProducts.map((id) => duplicateProducts(id))
    //   );
    //   return responses;
    // },
    mutationFn: async (selectedProducts) => {
      if (selectedProducts.length === 0) {
        throw new Error("No products selected");
      }

      console.log("Duplicating multiple products:", selectedProducts);
      return await duplicateProducts(selectedProducts);
    },
    onSuccess: (result, variables, context) => {
      console.log("Duplicate operation successful:", result);

      if (Array.isArray(variables?.selectedProducts)) {
        const count = variables.selectedProducts.length;
        successToast(`Successfully Duplicated ${count} products`);
        onSelectOrders([]);
        queryClient.invalidateQueries(["products"]);
      } else {
        successToast("Product Duplicated successfully");
        queryClient.invalidateQueries(["products"]);
        onSelectProducts([]);
      }
    },
    onError: (error) => {
      console.error("Duplicating products failed:", error);
      errorToast(error.response.data.message);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (selectedProducts) => {
      if (selectedProducts.length === 0) {
        throw new Error("No products selected");
      }

      if (selectedProducts.length === 1) {
        console.log("Deleting single product:", selectedProducts[0]);
        return await deleteSingleProduct(selectedProducts[0]);
      } else {
        console.log("Deleting multiple products:", selectedProducts);
        return await bulkDeleteProducts(selectedProducts);
      }
    },
    onSuccess: (result, variables, context) => {
      console.log("Delete operation successful:", result);

      if (Array.isArray(variables?.selectedProducts)) {
        const count = variables.selectedProducts.length;
        successToast(`Successfully deleted ${count} products`);
        onSelectOrders([]);
        queryClient.invalidateQueries(["products"]);
      } else {
        successToast("Product deleted successfully");
        queryClient.invalidateQueries(["products"]);
        onSelectProducts([]);
      }
    },
    onError: (error) => {
      console.error("Deleting products failed:", error);
      errorToast(error.response.data.message);
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ selectedProducts, visibility }) => {
      const responses = await Promise.all(
        selectedProducts.map((id) => updateProductVisibility(id, visibility))
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
