import { useQuery } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { useSelector } from "react-redux";

const fetchProducts = async ({ queryKey }) => {
  const [
    ,
    {
      id,
      storeId,
      page,
      pageSize,
      categories,
      visibility,
      sortBy,
      sortDirection,
      searchQuery,
    },
  ] = queryKey;

  const url = id
    ? `/api/stores/${storeId}/products/${id || ""}`
    : `/api/stores/${storeId}/products?page=${page}&limit=${pageSize}${
        categories ? `&categories=${categories}` : ""
      }${
        visibility ? `&visibility=${visibility}` : ""
      }&sortBy=${sortBy}&sortDirection=${sortDirection}${
        searchQuery ? `&search=${searchQuery}` : ""
      }`;

  const res = await axios.get(url);

  return res.data;
};

const useProducts = ({
  id,
  page,
  pageSize,
  categories,
  visibility,
  sortBy,
  sortDirection,
  searchQuery,
}) => {
  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;

  return useQuery({
    queryKey: id
      ? ["products", { id ,storeId}]
      : [
          "products",
          {
            storeId,
            page,
            pageSize,
            categories,
            visibility,
            sortBy,
            sortDirection,
            searchQuery,
          },
        ],
    queryFn: fetchProducts,
    keepPreviousData: true,
    onError: (error) => {
      console.error("Error fetching products:", error);
    },
  });
};

export default useProducts;
