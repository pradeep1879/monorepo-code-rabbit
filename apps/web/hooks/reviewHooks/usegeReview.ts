import { getReview } from "@/module/review/action";
import { updateReviewFindingStatus } from "@/module/review/action";
import type { FindingStatus } from "@/module/review/lib/findings";
import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useGetReview = () => {
  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => await getReview(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchInterval: 3000,
  });
};

export const useUpdateReviewFindingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      findingId,
      status,
    }: {
      findingId: string;
      status: FindingStatus;
    }) => updateReviewFindingStatus(findingId, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["dashbord-stats"] }),
      ]);
    },
  });
};
