import { useAuth } from "../contexts/AuthContext";
export type { User } from "../contexts/AuthContext";

export { useAuth };
export const useAuthHook = () => {
  return useAuth();
};