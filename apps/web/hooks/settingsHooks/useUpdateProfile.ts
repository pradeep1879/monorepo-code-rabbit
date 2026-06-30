import { updateUserProfile } from "@/module/setting/action";
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data:{name:string, email: string}) => {
      return await updateUserProfile(data);
    },
    onSuccess: (result) => {
      if(result.success){
        queryClient.invalidateQueries({queryKey: ["user-profile"]})
      }
      toast.success("User profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update user profile")
    }
  })
}