import { getUserProfile } from "@/module/setting/action"
import { useQuery } from "@tanstack/react-query"

export const useUserProfile = () => {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => await getUserProfile(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false
  })
}