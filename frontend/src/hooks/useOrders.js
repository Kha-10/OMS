import { useQuery } from "@tanstack/react-query";
import axios from "@/helper/axios";

const fetchOrders = async ({ queryKey }) => {
  const [
    ,
    {
      id,
      page,
      pageSize,
      sortBy,
      sortDirection,
      searchQuery,
      status,
      paymentStatus,
      fulfillmentStatus,
    },
  ] = queryKey;

  const url = id
    ? `/api/orders/${id || ""}`
    : `/api/orders?page=${page}&limit=${pageSize}&sortBy=${sortBy}&sortDirection=${sortDirection}${
        searchQuery ? `&search=${searchQuery}` : ""
      }${status ? `&status=${status}` : ""}${
        paymentStatus ? `&paymentStatus=${paymentStatus}` : ""
      }${fulfillmentStatus ? `&fulfillmentStatus=${fulfillmentStatus}` : ""}`;
  const res = await axios.get(url);

  return res.data;
};

const useOrders = ({
  id,
  page,
  pageSize,
  sortBy,
  sortDirection,
  searchQuery,
  status,
  paymentStatus,
  fulfillmentStatus,
}) => {
  return useQuery({
    queryKey: id
      ? ["orders", { id }]
      : [
          "orders",
          {
            page,
            pageSize,
            sortBy,
            sortDirection,
            searchQuery,
            status,
            paymentStatus,
            fulfillmentStatus,
          },
        ],
    queryFn: fetchOrders,
    keepPreviousData: true,
    onError: (error) => {
      console.error("Error fetching orders:", error);
    },
  });
};

export default useOrders;
