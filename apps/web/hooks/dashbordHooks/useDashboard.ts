import { getContributionStats, getDashboardStats, getMonthlyActivity } from "@/module/dashboard/action"
import { useQuery } from "@tanstack/react-query"

export const useDashboardStats =  () => {
  return useQuery({
    queryKey: ["dashbord-stats"],
    queryFn: async () => await getDashboardStats(),
    refetchOnWindowFocus: false
  });
}


export const useMonthlyActivity =  () => {
  return useQuery({
    queryKey: ["montly-activity"],
    queryFn: async () => await getMonthlyActivity(),
    refetchOnWindowFocus: false,
  })
}

export const useContributionStats = () => {
  return useQuery({
    queryKey: ["contribution-graph"],
    queryFn: async () => await getContributionStats(),
    staleTime: 1000 * 60 * 1
  })
}