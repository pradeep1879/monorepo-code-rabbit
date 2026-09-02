import { fetchRepositories } from "@/module/repository/action"
import { useInfiniteQuery } from "@tanstack/react-query"

const REPOSITORIES_PAGE_SIZE = 5;

export const useRepositories = () => {
  return useInfiniteQuery({
    queryKey: ["repositories"],
    
    queryFn: async ({pageParam = 1}) => {
      return await fetchRepositories(pageParam, REPOSITORIES_PAGE_SIZE);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < REPOSITORIES_PAGE_SIZE) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    refetchInterval: 3000,
  })
}
