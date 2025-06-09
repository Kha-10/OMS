import React from "react";
import { useEffect, useState } from "react";
import axios from "../helper/axios";
import RecipeCard from "../components/RecipeCard";
import Pagination from "@/components/Pagination";
import { RecipeSkeleton } from "@/components/LoadingSkeleton";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchRecipes } from "@/features/recipe/recipeSlice";
import { setIsNoti } from "@/features/recipe/notificationSlice";

const Products = () => {
  // const [recipes, setRecipes] = useState([]);
  // const [pagination, setPagination] = useState(null);
  // const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { recipes, loading, error, pagination } = useSelector(
    (state) => state.recipes
  );

  const { isNoti } = useSelector((state) => state.notifications);

  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search);
  const page = parseInt(searchQuery.get("page"))
    ? parseInt(searchQuery.get("page"))
    : 1;

  const { toast } = useToast();
  const navigate = useNavigate();

  // const clickHandler = () => {
  //   dispatch(setIsNoti())
  //   const status = "expired";
  //   navigate(`/Menus/Menu_Overview?status=${status}`);
  // };

  // useEffect(() => {
  //   const fetchRecipes = async () => {
  //     setLoading(true);
  //     try {
  //       const response = await axios.get(`/api/recipes?page=${page}`);
  //       if (response.status === 200) {
  //         setRecipes(response.data.data);
  //         setPagination(response.data.pagination);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching recipes:", error);
  //     } finally {
  //       setLoading(false);
  //       window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  //     }
  //   };
  //   fetchRecipes();
  // }, [page]);

  useEffect(() => {
    dispatch(fetchRecipes(page));
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [page]);

  const noti = recipes.some((recipe) => recipe.status == "expired");

  useEffect(() => {
    if (noti && isNoti) {
      toast({
        className:
          "top-0 right-0 flex fixed md:max-w-[420px] md:top-4 md:right-4",
        title: "Reminder:A few menu items have expired.",
        description: "Please review and make updates as needed.",
        action: (
          <ToastAction
            altText="Go check"
            onClick={clickHandler}
            className="bg-orange-400 text-white hover:bg-orange-500"
          >
            Review
          </ToastAction>
        ),
      });
    }
  }, [noti]);

  return (
    <>
      <div className="max-w-screen-lg mx-auto flex items-center flex-wrap gap-6 mt-3">
        {loading && recipes.length === 0
          ? Array(8)
              .fill()
              .map((_, i) => <RecipeSkeleton key={i} />)
          : recipes.map((recipe) => (
              <RecipeCard recipe={recipe} key={recipe._id} />
            ))}
      </div>
      {!!pagination && <Pagination pagination={pagination} page={page || 1} />}
    </>
  );
};

export default Products;