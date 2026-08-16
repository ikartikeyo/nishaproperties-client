import axiosInstance from "../api/api-client";

export interface PropertyImage {
  url: string;
  public_id: string;
  is_primary: boolean;
}

export interface Property {
  _id: string;
  title: string;
  description: string;
  property_type: "land" | "plot" | "house" | "villa" | "commercial";
  area: number;
  area_unit: "sq ft" | "acres" | "sq m";
  price: number;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  location_accuracy: string;
  status: "active" | "inactive";
  images: PropertyImage[];
  created_at: string;
  updated_at: string;
}

export interface PropertyFilter {
  property_type?: string;
  status?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
}

export const propertyApi = {
  listProperties: async (filters: PropertyFilter = {}) => {
    const params = new URLSearchParams();
    if (filters.property_type) params.append("property_type", filters.property_type);
    if (filters.status) params.append("status", filters.status);
    if (filters.city) params.append("city", filters.city);
    if (filters.min_price) params.append("min_price", String(filters.min_price));
    if (filters.max_price) params.append("max_price", String(filters.max_price));
    if (filters.min_area) params.append("min_area", String(filters.min_area));
    if (filters.max_area) params.append("max_area", String(filters.max_area));

    const res = await axiosInstance.get(`/api/property?${params.toString()}`);
    return res.data;
  },

  getProperty: async (id: string) => {
    const res = await axiosInstance.get(`/api/property/${id}`);
    return res.data;
  },

  createProperty: async (data: FormData) => {
    const res = await axiosInstance.post("/api/property", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  updateProperty: async (id: string, data: FormData) => {
    const res = await axiosInstance.put(`/api/property/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  deleteProperty: async (id: string) => {
    const res = await axiosInstance.delete(`/api/property/${id}`);
    return res.data;
  },

  uploadImages: async (propertyId: string, images: File[]) => {
    const formData = new FormData();
    images.forEach((file) => formData.append("images", file));

    const res = await axiosInstance.post(`/api/property/${propertyId}/images`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },
};