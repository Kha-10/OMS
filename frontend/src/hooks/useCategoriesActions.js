import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { useSelector } from "react-redux";
import { errorToast, successToast } from "@/helper/showToast";

const addCategory = async (storeId, newCategory) => {
  const { data } = await axios.post(
    `/api/stores/${storeId}/categories`,
    newCategory
  );
  return data;
};

const deleteCategories = async (selectedCategories, storeId) => {
  const res = await axios.post(`/api/stores/${storeId}/categories/bulk`, {
    ids: selectedCategories,
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
      successToast("Category added successfully");
    },

    onError: (error, newCategory, context) => {
      console.error("Category creation failed:", error);
      setSelectedCategories(context.previousCategories);
      errorToast(error.response.data.msg);
    },

    onSettled: () => {
      queryClient.invalidateQueries(["categories", storeId]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (selectedCategories) => {
      if (Array.isArray(selectedCategories) && selectedCategories.length > 0) {
        console.log("Using bulk delete for:", selectedCategories);
        return await deleteCategories(selectedCategories, storeId);
      } else {
        throw new Error("No valid category(ies) provided");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["categories", storeId]);
      setSelectedCategoriesId([]);
      successToast("Category deleted successfully");
    },
    onError: (error) => {
      console.error("Deleting categories failed:", error);
      errorToast(
        error.response.data.msg || error.response?.data?.errors?.ids?.msg
      );
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ selectedCategoriesId, visibility }) => {
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
      successToast("Category updated successfully");
    },
    onError: (error, { visibility }) => {
      console.error(`Updating visibility to '${visibility}' failed:`, error);
      errorToast(
        error.response.data.msg || error.response?.data?.errors?.ids?.msg
      );
    },
  });

  const updateSequenceMutation = useMutation({
    mutationFn: async (updatedCategories) => {
      console.log("updatedCategories", updatedCategories);
      return await updateSequenceProducts(storeId, updatedCategories);
    },
    onMutate: async () => {
      await queryClient.cancelQueries(["categories", storeId]);
    },

    onSuccess: () => {
      queryClient.invalidateQueries(["categories", storeId]);
      successToast("Category Order updated successfully");
    },
    onError: (error) => {
      console.error("updating SequenceProducts products failed:", error);
      errorToast(error.response.data.msg);
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
