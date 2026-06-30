import { diconnectAllRepositories, diconnectRepository, getConnectedRepositories } from "@/module/setting/action"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner";

export const useConnectedRepositories = () => {
  return useQuery({
    queryKey: ["connected-repositories"],
    queryFn: async () => await getConnectedRepositories(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false

  });
}


export const useDiconnectRepository = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id:string) => {
      return await diconnectRepository(id)
    },
    onSuccess: () => {
      toast.success("Repository diconnected successfully");
      queryClient.invalidateQueries({queryKey: ["connected-repositories"]})
    },

    onError: () => {
      toast.error("Failed to disconnect repository")
    }
  })
}



export const useDiconnectAllRepositories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await diconnectAllRepositories()
    },

    onSuccess: () => {
      toast.success("All repositories diconnected successfully");
      queryClient.invalidateQueries({queryKey: ["connected-repositories"]})
    },

    onError: () => {
      toast.error("Failed to disconnect repositories")
    }
  })
}