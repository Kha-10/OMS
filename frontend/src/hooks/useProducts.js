import { useQuery } from "@tanstack/react-query";
import axios from "@/helper/axios";

const fetchProducts = async ({ queryKey }) => {
  const [, { id, page, pageSize, categories, visibility, sortBy, sortDirection, searchQuery }] = queryKey;

  const url = id ? `/api/products/${id || ""}` : `/api/products?page=${page}&limit=${pageSize}${
    categories ? `&categories=${categories}` : ""
  }${visibility ? `&visibility=${visibility}` : ""}&sortBy=${sortBy}&sortDirection=${sortDirection}${
    searchQuery ? `&search=${searchQuery}` : ""
  }`

  const res = await axios.get(url);

  return res.data;
};

const useProducts = ({id, page, pageSize, categories, visibility, sortBy, sortDirection, searchQuery }) => {
  return useQuery({
    queryKey: id ? ["products",{id}] :["products", { page, pageSize, categories, visibility, sortBy, sortDirection, searchQuery }],
    queryFn: fetchProducts,
    keepPreviousData: true, 
    onError: (error) => {
        console.error("Error fetching products:", error);
      },
  });
};

export default useProducts;
