import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { MenuSkeleton } from "./LoadingSkeleton";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "../helper/axios";
import CategoryDialog from "./Category/CategoryDialog";
import DeleteCategoryDialog from "./Category/DeleteCategoryDialog";
import Lists from "./Category/Lists";
import { ScrollArea } from "@/components/ui/scroll-area";

function Categoty({ recipes, getMenusBycategory }) {
  const [isEditOpened, setIsEditOpened] = useState(false);
  const [isDeleteOpened, setIsDeleteOpened] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);
  const form = useForm({
    defaultValues: {
      title: "",
    },
  });

  const getCategories = async (id) => {
    setLoading(true);
    try {
      let res;
      if (id) {
        // form.setValue("id", id);
        res = await axios("/api/categories/" + id);
        if (res.status == 200) {
          form.setValue("title", res.data.title);
          setLoading(false);
        }
      } else {
        res = await axios("/api/categories/");
        if (res.status == 200) {
          setCategories(res.data);
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  useEffect(() => {
    if (!isEditOpened) {
      form.setValue("title", "");
    }
  }, [isEditOpened]);

  return (
    <div className="w-[30%] flex flex-col rounded-t-lg">
      {loading && categories.length == 0 ? (
        <MenuSkeleton />
      ) : (
        <>
          <div className="w-full bg-white border border-slate-200 rounded-t-lg text-sm p-3 flex items-center justify-between">
            <p>Categories</p>
            <CategoryDialog
              isEditOpened={isEditOpened}
              setIsEditOpened={setIsEditOpened}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              getCategories={getCategories}
              form={form}
            />
            <DeleteCategoryDialog
              isDeleteOpened={isDeleteOpened}
              setIsDeleteOpened={setIsDeleteOpened}
              categoryId={categoryId}
              setCategories={setCategories}
              setCategoryId={setCategoryId}
            />
          </div>
          <ScrollArea className="h-[520px]">
            {categories.map((category) => (
              <Lists
                key={category._id}
                category={category}
                recipes={recipes}
                setIsEditOpened={setIsEditOpened}
                getCategories={getCategories}
                setCategoryId={setCategoryId}
                setIsDeleteOpened={setIsDeleteOpened}
                categoryId={categoryId}
                getMenusBycategory={getMenusBycategory}
              />
            ))}
          </ScrollArea>
        </>
      )}
      <ToastContainer />
    </div>
  );
}

export default Categoty;
