import { useQuery } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { useSelector } from "react-redux";

const fetchCustomers = async ({ queryKey }) => {
  console.log("fetchCustomers");
  const [, { id,storeId, page, pageSize, searchQuery, sortBy, sortDirection }] =
    queryKey;

  const url = id
    ? `/api/stores/${storeId}/customers/${id || ""}`
    : `/api/stores/${storeId}/customers?page=${page}&limit=${pageSize}${
        searchQuery ? `&search=${searchQuery}` : ""
      }${sortBy ? `&sortBy=${sortBy}` : ""}${
        sortDirection ? `&sortDirection=${sortDirection}` : ""
      }`;

  const res = await axios.get(url);
  console.log('res',res);

  return res.data;
};

const useCustomers = ({
  id,
  page,
  pageSize,
  searchQuery,
  sortBy,
  sortDirection,
} = {}) => {
  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;
  return useQuery({
    queryKey: id
      ? ["customers", { id, storeId }]
      : [
          "customers",
          { storeId, page, pageSize, searchQuery, sortBy, sortDirection },
        ],
    queryFn: fetchCustomers,
    onError: (error) => {
      console.error("Error fetching products:", error);
    },
  });
};

export default useCustomers;
