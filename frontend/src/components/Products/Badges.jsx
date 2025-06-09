import React from "react";
import { useMemo } from "react";
import { Badge } from "../ui/badge";
import { X } from "lucide-react";
import useCategories from "@/hooks/useCategories";

const Badges = ({ categories, visibility, params, setSearchParams }) => {
  const { data } = useCategories();
  const categoriesFromDb = data?.data || [];

  const filteredCategories = useMemo(() => {
    let newCategories = categoriesFromDb.filter((c) =>
      categories?.includes(c._id)
    );
    return newCategories;
  }, [categories, visibility]);

  return (
    <>
      {(categories || visibility) && (
        <div className="flex items-center gap-3">
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Badge className="border border-gray-400 bg-white text-gray-600 hover:bg-white flex items-center gap-1">
                {filteredCategories.map((c, i) => (
                  <span key={c._id}>
                    {c.name} {i < filteredCategories.length - 1 && ","}
                  </span>
                ))}
                <button
                  onClick={() => {
                    params.delete("categories");
                    setSearchParams(params);
                  }}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </Badge>
            </div>
          )}

          {visibility && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {visibility}
                <button
                  onClick={() => {
                    params.delete("visibility");
                    setSearchParams(params);
                  }}
                  className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                >
                  <X size={14} />
                </button>
              </Badge>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Badges;
