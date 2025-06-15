import { useQuery } from "@tanstack/react-query";
import axios from "@/helper/axios";

const fetchCustomers = async ({ queryKey }) => {
  const [, { id, page, pageSize, searchQuery, sortBy, sortDirection }] =
    queryKey;
  const url = id
    ? `/api/customers/${id || ""}`
    : `/api/customers?page=${page}&limit=${pageSize}${
        searchQuery ? `&search=${searchQuery}` : ""
      }${sortBy ? `&sortBy=${sortBy}` : ""}${
        sortDirection ? `&sortDirection=${sortDirection}` : ""
      }`;

  const res = await axios.get(url);

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
  return useQuery({
    queryKey: id
      ? ["customers", { id }]
      : ["customers", { page, pageSize, searchQuery, sortBy, sortDirection }],
    queryFn: fetchCustomers,
    onError: (error) => {
      console.error("Error fetching products:", error);
    },
  });
};

export default useCustomers;
