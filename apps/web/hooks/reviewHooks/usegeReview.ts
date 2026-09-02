import { getReview } from "@/module/review/action"
import { useQuery } from "@tanstack/react-query"

export const useGetReview = () => {
  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => await getReview(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchInterval: 3000,
  })
}
