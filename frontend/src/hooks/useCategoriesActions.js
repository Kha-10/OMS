import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { useSelector } from "react-redux";

const addCategory = async (storeId, newCategory) => {
  const { data } = await axios.post(
    `/api/stores/${storeId}/categories`,
    newCategory
  );
  return data; // Assuming backend returns `{ _id, name }`
};

const deleteProducts = async (id) => {
  const res = await axios.delete(`/api/categories/${id}`);
  return res.data;
};

const updateProductVisibility = async (id, visibility) => {
  const res = await axios.patch(`/api/categories/${id}`, {
    visibility,
  });
  return res.data;
};
const updateCategoryVisibility = async (
  selectedCategories,
  storeId,
  visibility
) => {
  const res = await axios.post(`/api/stores/${storeId}/categories/visibility`, {
    ids: selectedCategories,
    visibility,
  });
  return res.data;
};

const updateSequenceProducts = async (storeId, updatedCategories) => {
  const res = await axios.patch(`/api/stores/${storeId}/categories`, {
    categories: updatedCategories,
  });
  return res.data;
};

const useCategoriesActions = (
  setSelectedCategories = null,
  selectedCategories = null,
  setSelectedCategoriesId = null
) => {
  const queryClient = useQueryClient();
  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;

  const addMutation = useMutation({
    mutationFn: async (newCategory) => {
      return await addCategory(storeId, newCategory);
    },

    onMutate: async (newCategory) => {
      await queryClient.cancelQueries(["categories", storeId]);

      const tempId = Date.now();
      const previousCategories = selectedCategories;

      setSelectedCategories([
        ...selectedCategories,
        { _id: tempId, name: newCategory.name },
      ]);

      return { previousCategories, tempId };
    },

    onSuccess: (savedCategory, newCategory, context) => {
      setSelectedCategories((prevCategories) =>
        prevCategories.map((category) =>
          category._id === context.tempId ? savedCategory : category
        )
      );
    },

    onError: (error, newCategory, context) => {
      console.error("Category creation failed:", error);
      setSelectedCategories(context.previousCategories);
    },

    onSettled: () => {
      queryClient.invalidateQueries(["categories", storeId]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (selectedCategories) => {
      const responses = await Promise.all(
        selectedCategories.map((id) => deleteProducts(id))
      );
      return responses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["categories", storeId]);
      setSelectedCategoriesId([]);
    },
    onError: (error) => {
      console.error("Deleting products failed:", error);
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ selectedCategoriesId, visibility }) => {
      console.log("selectedCategoriesId", selectedCategoriesId);
      if (
        Array.isArray(selectedCategoriesId) &&
        selectedCategoriesId.length > 0
      ) {
        console.log("Using bulk update for:", selectedCategoriesId);
        return await updateCategoryVisibility(
          selectedCategoriesId,
          storeId,
          visibility
        );
      } else {
        throw new Error("No valid category(ies) provided");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["categories", storeId]);
      setSelectedCategoriesId([]);
    },
    onError: (error, { visibility }) => {
      console.error(`Updating visibility to '${visibility}' failed:`, error);
    },
  });

  const updateSequenceMutation = useMutation({
    // mutationFn: updateSequenceProducts,
    mutationFn: async (updatedCategories) => {
      console.log("updatedCategories", updatedCategories);
      return await updateSequenceProducts(storeId, updatedCategories);
    },
    onMutate: async () => {
      await queryClient.cancelQueries(["categories", storeId]);
    },

    onSuccess: () => {
      queryClient.invalidateQueries(["categories", storeId]);
    },
    onError: (error) => {
      console.error("updating SequenceProducts products failed:", error);
    },
  });

  return {
    addMutation,
    deleteMutation,
    updateVisibilityMutation,
    updateSequenceMutation,
  };
};

export default useCategoriesActions;
