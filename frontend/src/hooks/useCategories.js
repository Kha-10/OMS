import { useQuery } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { useSelector } from "react-redux";

const fetchCategories = async ({ queryKey }) => {
  const [, { id, storeId, page, pageSize, all }] = queryKey;

  const url = id
    ? `/api/stores/${storeId}/categories/${id}`
    : `/api/stores/${storeId}/categories?page=${page}&limit=${pageSize}${
        all === true ? "&all=true" : ""
      }`;

  const res = await axios.get(url);

  return res.data;
};

const useCategories = ({ id, page, pageSize, all } = {}) => {
  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;

  return useQuery({
    queryKey: id
      ? ["categories", { id, storeId }]
      : ["categories", { storeId, page, pageSize, all }],
    queryFn: fetchCategories,
    keepPreviousData: true,
    enabled: !!storeId,
    onError: (error) => {
      console.error("Error fetching products:", error);
    },
  });
};

export default useCategories;
