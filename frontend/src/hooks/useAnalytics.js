import { useQuery } from "@tanstack/react-query";
import axios from "@/helper/axios";

const fetchAnalytics = async ({ queryKey }) => {
  const [, { storeId }] = queryKey;
  const url = storeId ? `/api/stores/${storeId}/analytics` : "";

  const res = await axios.get(url);

  return res.data;
};

const useAnalytics = (storeId) => {
  return useQuery({
    queryKey: ["analytics", { storeId }],
    queryFn: fetchAnalytics,
    keepPreviousData: true,
    onError: (error) => {
      console.error("Error fetching products:", error);
    },
  });
};

export default useAnalytics;
