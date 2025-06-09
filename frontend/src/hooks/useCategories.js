import { useQuery } from "@tanstack/react-query";
import axios from "@/helper/axios";

const fetchCategories = async ({ queryKey }) => {
  const [, { id, page, pageSize}] = queryKey;

  const url = id ? `/api/categories/${id || ""}` : `/api/categories?page=${page}&limit=${pageSize}`

  const res = await axios.get(url);

  return res.data;
};

const useCategories = ({id, page, pageSize }={}) => {
  return useQuery({
    queryKey: id ? ["categories",{id}] :["categories", { page, pageSize }],
    queryFn: fetchCategories,
    onError: (error) => {
        console.error("Error fetching products:", error);
      },
  });
};

export default useCategories;
