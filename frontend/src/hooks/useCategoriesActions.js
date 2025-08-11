import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/helper/axios";

const addCategory = async (category) => {
  const { data } = await axios.post("/api/categories", category);
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

const updateSequenceProducts = async (updatedCategories) => {
  const res = await axios.patch(`/api/categories`, updatedCategories);
  return res.data;
};

const useCategoriesActions = (
  setSelectedCategories = null,
  selectedCategories = null,
  setSelectedCategoriesId = null
) => {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: addCategory,

    onMutate: async (newCategory) => {
      await queryClient.cancelQueries(["categories"]);

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
      queryClient.invalidateQueries(["categories"]);
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
      queryClient.invalidateQueries(["categories"]);
      setSelectedCategoriesId([]);
    },
    onError: (error) => {
      console.error("Deleting products failed:", error);
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ selectedCategoriesId, visibility }) => {
      const responses = await Promise.all(
        selectedCategoriesId.map((id) =>
          updateProductVisibility(
            id,
            visibility === "visible" ? "hidden" : "visible"
          )
        )
      );
      return responses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
      setSelectedCategoriesId([]);
    },
    onError: (error, { visibility }) => {
      console.error(`Updating visibility to '${visibility}' failed:`, error);
    },
  });

  const updateSequenceMutation = useMutation({
    mutationFn: updateSequenceProducts,
    onMutate: async () => {
      await queryClient.cancelQueries(["categories"]);
    },

    onSuccess: () => {
      queryClient.invalidateQueries(["categories"]);
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
