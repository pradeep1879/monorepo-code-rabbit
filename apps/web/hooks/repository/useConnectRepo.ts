import { connectRepository } from "@/module/repository/action";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner";

type ConnectRepositoryInput = {
  owner?: string;
  repo: string;
  githubId: number | string;
};

export const useConnectRepositories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ owner, repo, githubId }: ConnectRepositoryInput) => {
      return await connectRepository(owner!, repo, githubId);
    },
    onSuccess:  () => {
      toast.success("Repository connected successfully");
      queryClient.invalidateQueries({ queryKey: ["repositories", "connected-repositories"] });
      queryClient.invalidateQueries({ queryKey: ["connected-repositories"] });
    },
    onError: () => {
      toast.error("Failed to connect repository");
    }
  })
}