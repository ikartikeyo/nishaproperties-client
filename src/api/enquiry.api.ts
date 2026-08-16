import axiosInstance from "../api/api-client";

export interface Enquiry {
  _id: string;
  property_id: string;
  property_title: string;
  full_name: string;
  place: string;
  mobile: string;
  email: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
}

export interface EnquiryFormData {
  full_name: string;
  place: string;
  mobile: string;
  email: string;
  property_id: string;
}

export const enquiryApi = {
  createEnquiry: async (data: EnquiryFormData) => {
    const res = await axiosInstance.post("/api/enquiries", data);
    return res.data;
  },

  listEnquiries: async () => {
    const res = await axiosInstance.get("/api/enquiries");
    return res.data;
  },

  getEnquiry: async (id: string) => {
    const res = await axiosInstance.get(`/api/enquiries/${id}`);
    return res.data;
  },

  updateEnquiryStatus: async (id: string, status: Enquiry["status"]) => {
    const res = await axiosInstance.patch(`/api/enquiries/${id}`, { status });
    return res.data;
  },
};