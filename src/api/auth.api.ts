import axiosInstance from "../api/api-client";

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const authApi = {
  login: async (data: LoginData) => {
    const res = await axiosInstance.post("/api/auth/login", data);
    return res.data;
  },

  register: async (data: RegisterData) => {
    const res = await axiosInstance.post("/api/auth/register", data);
    return res.data;
  },

  logout: async () => {
    const res = await axiosInstance.post("/api/auth/logout");
    return res.data;
  },

  getMe: async () => {
    const res = await axiosInstance.get("/api/auth/me");
    return res.data;
  },
};