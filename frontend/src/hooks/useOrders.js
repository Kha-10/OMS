import { useQuery } from "@tanstack/react-query";
import axios from "@/helper/axios";
import { useSelector } from "react-redux";

const fetchOrders = async ({ queryKey }) => {
  const [
    ,
    {
      id,
      storeId,
      page,
      pageSize,
      sortBy,
      sortDirection,
      searchQuery,
      orderStatus,
      paymentStatus,
      fulfillmentStatus,
    },
  ] = queryKey;

  const url = id
    ? `/api/stores/${storeId}/orders/${id}`
    : `/api/stores/${storeId}/orders?page=${page}&limit=${pageSize}&sortBy=${sortBy}&sortDirection=${sortDirection}${
        searchQuery ? `&search=${searchQuery}` : ""
      }${orderStatus ? `&orderStatus=${orderStatus}` : ""}${
        paymentStatus ? `&paymentStatus=${paymentStatus}` : ""
      }${fulfillmentStatus ? `&fulfillmentStatus=${fulfillmentStatus}` : ""}`;
  const res = await axios.get(url);
  console.log("res", res.data);
  return res.data;
};

const useOrders = (
  {
    id,
    page,
    pageSize,
    sortBy,
    sortDirection,
    searchQuery,
    orderStatus,
    paymentStatus,
    fulfillmentStatus,
  },
  options = {}
) => {
  const isSingle = !!id;
  const { stores } = useSelector((state) => state.stores);
  const storeId = stores?.[0]?._id;

  return useQuery({
    queryKey: isSingle
      ? ["orders", { id, storeId }]
      : [
          "orders",
          {
            storeId,
            page,
            pageSize,
            sortBy,
            sortDirection,
            searchQuery,
            orderStatus,
            paymentStatus,
            fulfillmentStatus,
          },
        ],
    queryFn: fetchOrders,
    enabled: isSingle ? !!id : true,
    keepPreviousData: true,
    onError: (error) => {
      console.error("Error fetching orders:", error);
    },
    ...options,
  });
};

export default useOrders;
