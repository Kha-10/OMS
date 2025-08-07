import { useQuery } from "@tanstack/react-query";
import axios from "@/helper/axios";

const fetchAnalytics = async () => {
  const url = `/api/analytics`;

  const res = await axios.get(url);

  return res.data;
};

const useAnalytics = () => {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
    keepPreviousData: true,
    onError: (error) => {
      console.error("Error fetching products:", error);
    },
  });
};

export default useAnalytics;
