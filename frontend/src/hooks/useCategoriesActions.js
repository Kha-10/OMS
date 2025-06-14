import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { successToast, errorToast } from "@/helper/showToast";

const addCategory = async (category) => {
  const { data } = await axios.post("/api/categories", category);
  return data; // Assuming backend returns `{ _id, name }`
};

// const deleteProducts = async (id) => {
//   const res = await axios.delete(`/api/categories/${id}`);
//   return res.data;
// };
const deleteSingleCategory = async (id) => {
  const res = await axios.delete(`/api/categories/${id}`);
  return res.data;
};

const bulkDeleteCateogries = async (categoryIds) => {
  const res = await axios.delete("/api/categories/bulk", {
    data: { ids: categoryIds },
  });
  return res.data;
};

const updateCategoryVisibility = async (selectedCategoriesId, visibility) => {
  const res = await axios.post(`/api/categories/visibility`, {
    ids: selectedCategoriesId,
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

  // const deleteMutation = useMutation({
  //   mutationFn: async (selectedCategories) => {
  //     const responses = await Promise.all(
  //       selectedCategories.map((id) => deleteProducts(id))
  //     );
  //     return responses;
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries(["categories"]);
  //     setSelectedCategoriesId([]);
  //   },
  //   onError: (error) => {
  //     console.error("Deleting products failed:", error);
  //   },
  // });

  const deleteMutation = useMutation({
    mutationFn: async (selectedCategories) => {
      if (selectedCategories.length === 0) {
        throw new Error("No Categories selected");
      }

      if (selectedCategories.length === 1) {
        console.log("Deleting single category:", selectedCategories[0]);
        return await deleteSingleCategory(selectedCategories[0]);
      } else {
        console.log("Deleting multiple Categories:", selectedCategories);
        return await bulkDeleteCateogries(selectedCategories);
      }
    },
    onSuccess: (result, variables, context) => {
      console.log("Delete operation successful:", result);

      if (Array.isArray(variables?.selectedCategories)) {
        const count = variables.selectedCategories.length;
        successToast(`Successfully deleted ${count} Categories`);
        setSelectedCategoriesId([]);
        queryClient.invalidateQueries(["categories"]);
      } else {
        successToast("Categories deleted successfully");
        queryClient.invalidateQueries(["categories"]);
        setSelectedCategoriesId([]);
      }
    },
    onError: (error) => {
      console.error("Deleting Categories failed:", error);
      errorToast(error.response.data.message);
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ selectedCategoriesId, visibility }) => {
      if (selectedCategoriesId.length === 0) {
        throw new Error("No categories selected");
      }

      console.log("Updating categories visibility :", selectedCategoriesId);
      return await updateCategoryVisibility(
        selectedCategoriesId,
        visibility === "visible" ? "hidden" : "visible"
      );
    },
    onSuccess: (result, variables, context) => {
      console.log("update visibilty operation successful:", result);

      if (Array.isArray(variables?.selectedCategoriesId)) {
        const count = variables.selectedCategoriesId.length;
        successToast(`Successfully updated Visibility of ${count} categories`);
        setSelectedCategoriesId([]);
        queryClient.invalidateQueries(["categories"]);
      }
    },
    onError: (error) => {
      console.error("upadtin visibility categories failed:", error);
      errorToast(error.response.data.message);
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
