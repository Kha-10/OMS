import { useQuery } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { useSelector } from "react-redux";

const fetchCategories = async ({ queryKey }) => {
  const [, { id, storeId, page, pageSize }] = queryKey;

  const url = id
    ? `/api/stores/${storeId}/categories/${id}`
    : `/api/stores/${storeId}/categories?page=${page}&limit=${pageSize}`;

  const res = await axios.get(url);

  return res.data;
};

const useCategories = ({ id, page, pageSize } = {}) => {
  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;

  return useQuery({
    queryKey: id
      ? ["categories", { id, storeId }]
      : ["categories", { storeId, page, pageSize }],
    queryFn: fetchCategories,
    keepPreviousData: true,
    enabled: !!storeId,
    onError: (error) => {
      console.error("Error fetching products:", error);
    },
  });
};

export default useCategories;
