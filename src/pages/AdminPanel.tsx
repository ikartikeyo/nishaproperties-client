import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";
import { Link } from "react-router-dom";
import {
  getCurrentGPSCoordinates,
  reverseGeocodeCoordinates,
  getGoogleMapsUrl,
  getEffectiveLocationUrl,
  extractCoordinatesFromUrl,
} from "../utils/geo";

interface PropertyItem {
  _id: string;
  title: string;
  price: number;
  area: number;
  areaUnit?: string;
  propertyType?: string;
  city?: string;
  state?: string;
  address?: string;
  postalCode?: string;
  description?: string;
  locationUrl?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationSource?: string;
  status: string;
  isFeatured: boolean;
  images?: string[];
  createdAt?: string;
}

interface EnquiryItem {
  _id: string;
  enquiryReference?: string;
  enquiryType?: "BUY_LEAD" | "GENERAL" | "SELL_LISTING";
  propertyNameSnapshot?: string;
  propertyId?: any;
  fullName: string;
  place?: string;
  mobileNumber: string;
  email: string;
  message?: string;
  // Sell listing fields
  plotTitle?: string;
  propertyType?: string;
  expectedPrice?: number;
  area?: number;
  areaUnit?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  description?: string;
  locationUrl?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationSource?: string;
  images?: string[];
  publishedPropertyId?: string;
  status: "NEW" | "CONTACTED" | "REVIEWING" | "APPROVED" | "PUBLISHED" | "CLOSED";
  createdAt?: string;
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, setTheme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"properties" | "enquiries" | "sell-enquiries" | "add-property">("properties");

  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Multi-select state
  const [selectedProps, setSelectedProps] = useState<string[]>([]);
  const [selectedEnqs, setSelectedEnqs] = useState<string[]>([]);
  const [selectedSellEnqs, setSelectedSellEnqs] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Sell enquiry actions state
  const [publishingEnquiryId, setPublishingEnquiryId] = useState<string | null>(null);
  const [viewingSellEnquiry, setViewingSellEnquiry] = useState<EnquiryItem | null>(null);

  // Edit property state
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

  // New / Edit Property Form State
  const [newProp, setNewProp] = useState({
    title: "",
    propertyType: "Agricultural",
    price: "",
    area: "",
    areaUnit: "Acre",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    description: "",
    locationUrl: "",
    isFeatured: false,
  });

  // Upload & GPS States
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [capturingGPS, setCapturingGPS] = useState(false);
  const [gpsData, setGpsData] = useState<{
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    source: "DEVICE_GPS" | "IMAGE_EXIF" | "MANUAL" | "VERIFIED";
  } | null>(null);

  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Live in-app camera viewfinder states & refs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();

      // Fetch properties
      const propRes = await fetch("/api/property/admin/properties", {
        headers,
        credentials: "include",
      });
      const propData = await propRes.json();
      if (propRes.ok && propData.data) {
        setProperties(propData.data);
      }

      // Fetch enquiries
      const enqRes = await fetch("/api/enquiry/admin/enquiries", {
        headers,
        credentials: "include",
      });
      const enqData = await enqRes.json();
      if (enqRes.ok && enqData.data) {
        setEnquiries(enqData.data);
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // GPS Auto-Fetch Handler
  const handleCaptureGPS = async () => {
    setCapturingGPS(true);
    setMessage(null);
    try {
      const coords = await getCurrentGPSCoordinates();
      setGpsData({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        source: "DEVICE_GPS",
      });

      // Reverse geocode to autofill address
      const geoInfo = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
      setNewProp((prev) => ({
        ...prev,
        city: prev.city || geoInfo.city,
        state: prev.state || geoInfo.state,
        postalCode: prev.postalCode || geoInfo.postalCode,
        address: prev.address || geoInfo.address,
      }));

      setMessage({
        type: "success",
        text: `📍 GPS Captured: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)} (Accuracy: ±${coords.accuracy}m). Address autofilled!`,
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Failed to capture GPS location.",
      });
    } finally {
      setCapturingGPS(false);
    }
  };

  // Manual Google Maps URL Input Handler with Smart GPS Extraction
  const handleLocationUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setNewProp((prev) => ({ ...prev, locationUrl: url }));

    if (url) {
      const extracted = extractCoordinatesFromUrl(url);
      if (extracted) {
        setGpsData({
          latitude: extracted.latitude,
          longitude: extracted.longitude,
          source: "MANUAL",
        });
        setMessage({
          type: "success",
          text: `📍 Extracted GPS from Maps link: ${extracted.latitude.toFixed(4)}, ${extracted.longitude.toFixed(4)}`,
        });
      }
    }
  };

  // Remove / Reset Auto-Detected Location
  const handleRemoveLocation = () => {
    setGpsData(null);
    setNewProp((prev) => ({
      ...prev,
      locationUrl: "",
    }));
    setMessage({
      type: "success",
      text: "📍 Auto-detected GPS location removed successfully.",
    });
  };

  // Open live camera stream in viewfinder modal
  const handleOpenLiveCamera = async (facing: "environment" | "user" = cameraFacing) => {
    setIsCameraOpen(true);
    setMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Live camera is not supported in this browser. Opening file camera.");
      }

      // Stop existing stream if switching
      if (videoRef.current && videoRef.current.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.warn);
      }
    } catch (err: any) {
      console.warn("Live camera fallback to device camera input:", err);
      setIsCameraOpen(false);
      cameraInputRef.current?.click();
    }
  };

  const handleCloseLiveCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const handleToggleFacingMode = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    handleOpenLiveCamera(nextFacing);
  };

  // Capture snapshot from live video stream, upload, and auto-detect GPS on the spot!
  const handleSnapLiveCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      handleCloseLiveCamera();

      // Trigger auto-GPS immediately on snapshot
      handleCaptureGPS();

      const file = new File([blob], `plot-camera-${Date.now()}.jpg`, { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("images", file);

      setUploadingImage(true);
      try {
        const res = await fetch("/api/property/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success && data.data?.urls) {
          setUploadedImages((prev) => [...prev, ...data.data.urls]);
          setMessage({
            type: "success",
            text: `✓ Photo captured! 📍 Live GPS location auto-locked and address autofilled!`,
          });
        }
      } catch (err: any) {
        setMessage({ type: "error", text: "Failed to upload captured snapshot." });
      } finally {
        setUploadingImage(false);
      }
    }, "image/jpeg", 0.92);
  };

  // Image Upload Handler: Auto-detects GPS ONLY when user clicks photo using camera
  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isFromCamera: boolean = false
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setMessage(null);

    // If user clicked photo with camera on-site, auto-fetch device GPS location
    if (isFromCamera) {
      handleCaptureGPS();
    }

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }

      const res = await fetch("/api/property/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.data?.urls) {
        setUploadedImages((prev) => [...prev, ...data.data.urls]);
        setMessage({
          type: "success",
          text: `✓ ${data.data.urls.length} photo(s) uploaded successfully! ${
            isFromCamera ? "📍 Auto-capturing on-site GPS coordinates..." : ""
          }`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to upload image.",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: "Network error during image upload.",
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const normalizeAreaUnit = (unit?: string): string => {
    if (!unit) return "Acre";
    const lower = unit.toLowerCase().trim();
    if (lower === "acre" || lower === "acres") return "Acre";
    if (lower === "bigha" || lower === "bighas") return "Bigha";
    if (lower === "sqft" || lower === "sq.ft" || lower === "sq ft" || lower === "sq_ft") return "sqft";
    if (lower === "gaj" || lower === "sq yards" || lower === "sq. yards" || lower === "sqyards") return "Gaj";
    if (lower === "hectare" || lower === "hectares") return "Hectare";
    if (lower === "guntha" || lower === "gunthas") return "Guntha";
    if (lower === "cent" || lower === "cents") return "Cent";
    if (lower === "biswa" || lower === "biswas") return "Biswa";
    if (lower === "katha" || lower === "kattha") return "Katha";
    if (lower === "marla" || lower === "marlas") return "Marla";
    if (lower === "kanal" || lower === "kanals") return "Kanal";
    return unit;
  };

  // Open Property in Edit Mode
  const handleEditProperty = (p: PropertyItem) => {
    setEditingPropertyId(p._id);
    setNewProp({
      title: p.title || "",
      propertyType: p.propertyType || "Agricultural",
      price: p.price ? String(p.price) : "",
      area: p.area ? String(p.area) : "",
      areaUnit: normalizeAreaUnit(p.areaUnit),
      address: p.address || "",
      city: p.city || "",
      state: p.state || "",
      postalCode: p.postalCode || "",
      description: p.description || "",
      locationUrl: p.locationUrl || "",
      isFeatured: Boolean(p.isFeatured),
    });
    setUploadedImages(p.images || []);
    if (p.latitude && p.longitude) {
      setGpsData({
        latitude: p.latitude,
        longitude: p.longitude,
        accuracy: p.locationAccuracy,
        source: (p.locationSource as any) || "MANUAL",
      });
    } else {
      setGpsData(null);
    }
    setActiveTab("add-property");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingPropertyId(null);
    setNewProp({
      title: "",
      propertyType: "Agricultural",
      price: "",
      area: "",
      areaUnit: "Acre",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      description: "",
      locationUrl: "",
      isFeatured: false,
    });
    setUploadedImages([]);
    setGpsData(null);
    setActiveTab("properties");
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    try {
      const imagesArray =
        uploadedImages.length > 0
          ? uploadedImages
          : ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80"];

      const payload = {
        title: newProp.title,
        propertyType: newProp.propertyType,
        price: Number(newProp.price),
        area: Number(newProp.area),
        areaUnit: newProp.areaUnit,
        address: newProp.address,
        city: newProp.city,
        state: newProp.state,
        postalCode: newProp.postalCode,
        description: newProp.description,
        isFeatured: newProp.isFeatured,
        locationUrl: newProp.locationUrl,
        images: imagesArray,
        latitude: gpsData?.latitude,
        longitude: gpsData?.longitude,
        locationAccuracy: gpsData?.accuracy,
        locationSource: gpsData?.source || (newProp.locationUrl ? "MANUAL_LINK" : "MANUAL"),
      };

      const url = editingPropertyId
        ? `/api/property/admin/properties/${editingPropertyId}`
        : "/api/property/admin/properties";

      const method = editingPropertyId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (editingPropertyId) {
          // Optimistically update properties list
          setProperties((prev) =>
            prev.map((item) => (item._id === editingPropertyId ? data.data : item))
          );
          setMessage({ type: "success", text: "✓ Property plot updated successfully!" });
        } else {
          // Optimistically append new property
          if (data.data) {
            setProperties((prev) => [data.data, ...prev]);
          }
          setMessage({ type: "success", text: "✓ Property plot with location & photos published successfully!" });
        }

        setEditingPropertyId(null);
        setNewProp({
          title: "",
          propertyType: "Agricultural",
          price: "",
          area: "",
          areaUnit: "Acre",
          address: "",
          city: "",
          state: "",
          postalCode: "",
          description: "",
          locationUrl: "",
          isFeatured: false,
        });
        setUploadedImages([]);
        setGpsData(null);
        setActiveTab("properties");
        fetchData();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to save property" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error saving property" });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      const res = await fetch(`/api/property/admin/properties/${id}/featured`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        setProperties((prev) =>
          prev.map((p) => (p._id === id ? { ...p, isFeatured: !p.isFeatured } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Instant on-the-spot single delete property
  const handleDeleteProperty = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this property listing?")) return;

    // Instant optimistic update
    setProperties((prev) => prev.filter((p) => p._id !== id));
    setSelectedProps((prev) => prev.filter((pid) => pid !== id));

    try {
      const res = await fetch(`/api/property/admin/properties/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Property deleted on the spot." });
      } else {
        fetchData(); // Rollback if failed
      }
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  // Instant on-the-spot bulk delete properties
  const handleBulkDeleteProperties = async () => {
    if (selectedProps.length === 0) return;
    if (!window.confirm(`Delete ${selectedProps.length} selected land plot(s)?`)) return;

    const idsToDelete = [...selectedProps];
    setIsDeletingBulk(true);

    // Instant optimistic update
    setProperties((prev) => prev.filter((p) => !idsToDelete.includes(p._id)));
    setSelectedProps([]);

    try {
      const res = await fetch("/api/property/admin/properties/bulk", {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ ids: idsToDelete }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `${idsToDelete.length} properties deleted successfully.` });
      } else {
        fetchData();
      }
    } catch (err) {
      console.error(err);
      fetchData();
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // Instant on-the-spot single delete enquiry
  const handleDeleteEnquiry = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer inquiry?")) return;

    // Instant optimistic update
    setEnquiries((prev) => prev.filter((e) => e._id !== id));
    setSelectedEnqs((prev) => prev.filter((eid) => eid !== id));

    try {
      const res = await fetch(`/api/enquiry/admin/enquiries/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Enquiry deleted on the spot." });
      } else {
        fetchData();
      }
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  // Instant on-the-spot bulk delete enquiries
  const handleBulkDeleteEnquiries = async () => {
    if (selectedEnqs.length === 0) return;
    if (!window.confirm(`Delete ${selectedEnqs.length} selected inquiry(ies)?`)) return;

    const idsToDelete = [...selectedEnqs];
    setIsDeletingBulk(true);

    // Instant optimistic update
    setEnquiries((prev) => prev.filter((e) => !idsToDelete.includes(e._id)));
    setSelectedEnqs([]);

    try {
      const res = await fetch("/api/enquiry/admin/enquiries/bulk", {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ ids: idsToDelete }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `${idsToDelete.length} enquiries deleted successfully.` });
      } else {
        fetchData();
      }
    } catch (err) {
      console.error(err);
      fetchData();
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleUpdateEnquiryStatus = async (id: string, newStatus: "NEW" | "CONTACTED" | "CLOSED") => {
    setEnquiries((prev) =>
      prev.map((e) => (e._id === id ? { ...e, status: newStatus } : e))
    );

    try {
      await fetch(`/api/enquiry/admin/enquiries/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Property multi-select toggles
  const toggleSelectProperty = (id: string) => {
    setSelectedProps((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllProperties = () => {
    if (selectedProps.length === properties.length) {
      setSelectedProps([]);
    } else {
      setSelectedProps(properties.map((p) => p._id));
    }
  };

  // Enquiry multi-select toggles
  const toggleSelectEnquiry = (id: string) => {
    setSelectedEnqs((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 1-Click Publish Sell Inquiry as Live Property
  const handlePublishSellListing = async (enquiry: EnquiryItem) => {
    if (!window.confirm(`Publish "${enquiry.plotTitle || "this land plot"}" to the live catalog?`)) return;

    setPublishingEnquiryId(enquiry._id);
    try {
      const res = await fetch(`/api/enquiry/admin/enquiries/${enquiry._id}/publish`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ isFeatured: false }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: `Plot "${data.data?.property?.title || "Land"}" published to active catalog successfully!`,
        });
        fetchData();
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to publish plot to catalog.",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Network error while publishing plot.",
      });
    } finally {
      setPublishingEnquiryId(null);
    }
  };

  const handleUpdateSellEnquiryStatus = async (id: string, newStatus: EnquiryItem["status"]) => {
    setEnquiries((prev) =>
      prev.map((e) => (e._id === id ? { ...e, status: newStatus } : e))
    );

    try {
      await fetch(`/api/enquiry/admin/enquiries/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelectSellEnquiry = (id: string) => {
    setSelectedSellEnqs((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllSellEnquiries = (sellList: EnquiryItem[]) => {
    if (selectedSellEnqs.length === sellList.length) {
      setSelectedSellEnqs([]);
    } else {
      setSelectedSellEnqs(sellList.map((e) => e._id));
    }
  };

  const handleBulkDeleteSellEnquiries = async () => {
    if (selectedSellEnqs.length === 0) return;
    if (!window.confirm(`Delete ${selectedSellEnqs.length} selected sell inquiry(ies)?`)) return;

    const idsToDelete = [...selectedSellEnqs];
    setIsDeletingBulk(true);

    setEnquiries((prev) => prev.filter((e) => !idsToDelete.includes(e._id)));
    setSelectedSellEnqs([]);

    try {
      const res = await fetch("/api/enquiry/admin/enquiries/bulk", {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ ids: idsToDelete }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `${idsToDelete.length} sell enquiries deleted successfully.` });
      } else {
        fetchData();
}
    } catch (err) {
      console.error(err);
      fetchData();
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const toggleSelectAllEnquiries = () => {
    if (selectedEnqs.length === buyerLeads.length) {
      setSelectedEnqs([]);
    } else {
      setSelectedEnqs(buyerLeads.map((e) => e._id));
    }
  };

  const buyerLeads = enquiries.filter((e) => e.enquiryType !== "SELL_LISTING");
  const sellInquiries = enquiries.filter((e) => e.enquiryType === "SELL_LISTING");

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="https://res.cloudinary.com/dae4jpydb/image/upload/v1786888878/IMG_5090-removebg-preview_t7lceq.png"
              alt="Nisha Properties Logo"
              className="h-12 w-12 object-contain shrink-0 drop-shadow-sm"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 uppercase tracking-wide">
                  {t("adminConsoleBadge")}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t("loggedInAs")} <strong className="text-slate-700 dark:text-slate-200">{user?.email}</strong></span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{t("plotCraftOperations")}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5"
            >
              <span>{t("viewLiveCatalog")} ↗</span>
            </Link>
          </div>
        </div>

        {/* Notifications */}
        {message && (
          <div
            className={`p-4 rounded-xl text-sm flex items-center justify-between transition-all ${
              message.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
            }`}
          >
            <span className="font-medium text-xs sm:text-sm">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-xs font-bold uppercase opacity-60 hover:opacity-100 ml-4 px-2 py-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t("totalPlots")}</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block">{properties.length}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">{t("activeCatalogListings")}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t("customerInquiries")} (Buyers)</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">{buyerLeads.length}</span>
            <span className="text-[11px] text-blue-500 dark:text-blue-400 font-semibold mt-1 block">
              {buyerLeads.filter((e) => e.status === "NEW").length} {t("leadsReceived")}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Plots for Sale (Sellers)</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {sellInquiries.length}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
              {sellInquiries.filter((e) => e.status === "NEW").length} New Submissions
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{t("gpsVerifiedPlots")}</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 block">
              {properties.filter((p) => p.latitude && p.longitude).length}
            </span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1 block">{t("directMapsEnabled")}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveTab("properties")}
            className={`py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm rounded-t-xl transition whitespace-nowrap ${
              activeTab === "properties"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-l border-r border-slate-200 dark:border-slate-800 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {t("tabPlotsManagement")} ({properties.length})
          </button>
          <button
            onClick={() => setActiveTab("enquiries")}
            className={`py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm rounded-t-xl transition whitespace-nowrap ${
              activeTab === "enquiries"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-l border-r border-slate-200 dark:border-slate-800 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {t("tabCustomerInquiries")} ({buyerLeads.length})
          </button>
          <button
            onClick={() => setActiveTab("sell-enquiries")}
            className={`py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm rounded-t-xl transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "sell-enquiries"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-t-2 border-l border-r border-slate-200 dark:border-slate-800 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <span>Plots for Sale (Seller Leads)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {sellInquiries.length}
            </span>
          </button>
          <button
            onClick={() => {
              if (activeTab !== "add-property") {
                setEditingPropertyId(null);
                setNewProp({
                  title: "",
                  propertyType: "Agricultural",
                  price: "",
                  area: "",
                  areaUnit: "Acre",
                  address: "",
                  city: "",
                  state: "",
                  postalCode: "",
                  description: "",
                  locationUrl: "",
                  isFeatured: false,
                });
                setUploadedImages([]);
                setGpsData(null);
              }
              setActiveTab("add-property");
            }}
            className={`py-3 px-4 sm:px-6 font-bold text-xs sm:text-sm rounded-t-xl transition whitespace-nowrap ${
              activeTab === "add-property"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t-2 border-l border-r border-slate-200 dark:border-slate-800 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {editingPropertyId ? t("tabEditPlot") : t("tabAddPlot")}
          </button>
        </div>

        {/* TAB 1: PROPERTIES MANAGEMENT */}
        {activeTab === "properties" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
            
            {/* Header & Bulk Actions Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{t("manageLandListings")}</h2>
                <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                  {properties.length}
                </span>
              </div>

              {/* Bulk Action Bar */}
              {selectedProps.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap animate-fadeIn">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                    {selectedProps.length} {t("plotsSelected")}
                  </span>
                  <button
                    onClick={handleBulkDeleteProperties}
                    disabled={isDeletingBulk}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t("deleteSelected")} ({selectedProps.length})
                  </button>
                  <button
                    onClick={() => setSelectedProps([])}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {t("deselectAll")}
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                {t("loadingProperties")}
              </div>
            ) : properties.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                {t("noPlotsInTable")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 min-w-[700px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProps.length === properties.length && properties.length > 0}
                          onChange={toggleSelectAllProperties}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                        />
                      </th>
                      <th className="p-4">{t("colPlot")}</th>
                      <th className="p-4">{t("colType")}</th>
                      <th className="p-4">{t("colPrice")}</th>
                      <th className="p-4">{t("colArea")}</th>
                      <th className="p-4">{t("colLocationGps")}</th>
                      <th className="p-4">{t("colFeatured")}</th>
                      <th className="p-4 text-right">{t("colActions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {properties.map((p) => {
                      const isSelected = selectedProps.includes(p._id);
                      return (
                        <tr
                          key={p._id}
                          className={`transition ${
                            isSelected ? "bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-950/60" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectProperty(p._id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                            />
                          </td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <img
                              src={p.images?.[0] || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=100"}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                            />
                            <div>
                              <span className="line-clamp-1 text-xs sm:text-sm">{p.title}</span>
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{p.status}</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs font-semibold">{p.propertyType}</td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white">₹{p.price?.toLocaleString("en-IN")}</td>
                          <td className="p-4 text-xs">{p.area?.toLocaleString()} {p.areaUnit || "sqft"}</td>
                          <td className="p-4 text-xs">
                            <div className="text-slate-800 dark:text-slate-200 font-medium">{p.city ? `${p.city}, ${p.state}` : "—"}</div>
                            {getEffectiveLocationUrl(p) ? (
                              <a
                                href={getEffectiveLocationUrl(p)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-0.5"
                              >
                                {p.latitude && p.longitude ? `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}` : "Open Map Link"}
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">{t("noLocationLink")}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleFeatured(p._id)}
                              className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                                p.isFeatured
                                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/80"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                              }`}
                            >
                              {p.isFeatured ? t("featuredBadge") : t("btnStandard")}
                            </button>
                          </td>
                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleEditProperty(p)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition inline-flex items-center gap-1 shadow-sm"
                              title="Edit plot specifications, photos & GPS"
                            >
                              {t("btnEdit")}
                            </button>
                            <Link
                              to={`/properties/${p._id}`}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 inline-block"
                            >
                              {t("btnView")}
                            </Link>
                            <button
                              onClick={() => handleDeleteProperty(p._id)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition inline-block"
                            >
                              {t("btnDelete")}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BUYER ENQUIRIES LIST */}
        {activeTab === "enquiries" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
            
            {/* Header & Bulk Actions Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{t("customerInquiries")} (Buyers)</h2>
                <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                  {buyerLeads.length}
                </span>
              </div>

              {/* Bulk Action Bar */}
              {selectedEnqs.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap animate-fadeIn">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                    {selectedEnqs.length} {t("inquiriesSelected")}
                  </span>
                  <button
                    onClick={handleBulkDeleteEnquiries}
                    disabled={isDeletingBulk}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t("deleteSelected")} ({selectedEnqs.length})
                  </button>
                  <button
                    onClick={() => setSelectedEnqs([])}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    {t("deselectAll")}
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                {t("loadingProperties")}
              </div>
            ) : buyerLeads.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                {t("noInquiriesInTable")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 min-w-[750px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectedEnqs.length === buyerLeads.length && buyerLeads.length > 0}
                          onChange={toggleSelectAllEnquiries}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                        />
                      </th>
                      <th className="p-4">{t("colRef")}</th>
                      <th className="p-4">{t("colBuyerName")}</th>
                      <th className="p-4">{t("colContact")}</th>
                      <th className="p-4">{t("colEmail")}</th>
                      <th className="p-4">{t("colPlace")}</th>
                      <th className="p-4">{t("colStatus")}</th>
                      <th className="p-4 text-right">{t("colActions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {buyerLeads.map((e) => {
                      const isSelected = selectedEnqs.includes(e._id);
                      return (
                        <tr
                          key={e._id}
                          className={`transition ${
                            isSelected ? "bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-950/60" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectEnquiry(e._id)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                            />
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 block">
                              {e.enquiryReference || "ENQ-REF"}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white text-xs line-clamp-1">
                              {e.propertyNameSnapshot || "Land Plot"}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-900 dark:text-white">{e.fullName}</td>
                          <td className="p-4 font-mono text-xs text-slate-700 dark:text-slate-300">{e.mobileNumber}</td>
                          <td className="p-4 text-xs text-slate-700 dark:text-slate-300">{e.email}</td>
                          <td className="p-4 text-xs text-slate-700 dark:text-slate-300">{e.place || "—"}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                e.status === "NEW"
                                  ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                                  : e.status === "CONTACTED"
                                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                                  : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                              }`}
                            >
                              {e.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1.5 flex items-center justify-end whitespace-nowrap">
                            <a
                              href={`https://wa.me/${e.mobileNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                `Hello ${e.fullName}, I am following up on your inquiry (${e.enquiryReference || "ENQ"}) for "${e.propertyNameSnapshot || "Land Plot"}". When is a convenient time to discuss details?`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                              </svg>
                              {t("btnWhatsAppChat")}
                            </a>
                            <button
                              onClick={() => handleUpdateEnquiryStatus(e._id, "CONTACTED")}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300"
                            >
                              {t("btnMarkContacted")}
                            </button>
                            <button
                              onClick={() => handleDeleteEnquiry(e._id)}
                              className="px-2 py-1 rounded text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400"
                            >
                              {t("btnDelete")}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PLOTS FOR SALE (SELLER LEADS) */}
        {activeTab === "sell-enquiries" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
            {/* Header & Bulk Actions Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Plots for Sale (Seller Submissions)</h2>
                <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-bold border border-emerald-300 dark:border-emerald-700">
                  {sellInquiries.length} {sellInquiries.length === 1 ? "listing" : "listings"}
                </span>
              </div>

              {/* Bulk Action Bar */}
              {selectedSellEnqs.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap animate-fadeIn">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    {selectedSellEnqs.length} Selected
                  </span>
                  <button
                    onClick={handleBulkDeleteSellEnquiries}
                    disabled={isDeletingBulk}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected ({selectedSellEnqs.length})
                  </button>
                  <button
                    onClick={() => setSelectedSellEnqs([])}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    Deselect All
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                Loading seller submissions...
              </div>
            ) : sellInquiries.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-sm space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="font-bold text-slate-700 dark:text-slate-300">No Land-for-Sale Submissions Yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">When consumers use the "Sell Land" form on the website, their submissions with plot specs and photos will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 min-w-[950px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectedSellEnqs.length === sellInquiries.length && sellInquiries.length > 0}
                          onChange={() => toggleSelectAllSellEnquiries(sellInquiries)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                        />
                      </th>
                      <th className="p-4">Plot / Land Details</th>
                      <th className="p-4">Seller Contact</th>
                      <th className="p-4">Price & Area</th>
                      <th className="p-4">Location & GPS</th>
                      <th className="p-4">Photos</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sellInquiries.map((e) => {
                      const isSelected = selectedSellEnqs.includes(e._id);
                      return (
                        <tr
                          key={e._id}
                          className={`transition ${
                            isSelected ? "bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/60" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectSellEnquiry(e._id)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                            />
                          </td>
                          <td className="p-4 max-w-xs">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {e.enquiryReference || "SELL-REF"}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {e.propertyType || "Land"}
                              </span>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm block line-clamp-2">
                              {e.plotTitle || e.propertyNameSnapshot || "Plot for Sale"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-900 dark:text-white text-xs block">{e.fullName}</span>
                            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 block">{e.mobileNumber}</span>
                            {e.email && e.email !== "consumer@nishaproperties.com" && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[140px]">{e.email}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs block">
                              {e.expectedPrice ? `₹${Number(e.expectedPrice).toLocaleString("en-IN")}` : "On Request"}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                              {e.area || "—"} {e.areaUnit || "Acre"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block">
                              {e.city || e.place || "—"}{e.state ? `, ${e.state}` : ""}
                            </span>
                            {e.latitude && e.longitude ? (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${e.latitude},${e.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
                              >
                                <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <span>GPS Map ↗</span>
                              </a>
                            ) : e.locationUrl ? (
                              <a
                                href={e.locationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Map Link ↗
                              </a>
                            ) : null}
                          </td>
                          <td className="p-4">
                            {e.images && e.images.length > 0 ? (
                              <button
                                onClick={() => setViewingSellEnquiry(e)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                              >
                                <span>📷</span>
                                <span>{e.images.length} {e.images.length === 1 ? "photo" : "photos"}</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">No photos</span>
                            )}
                          </td>
                          <td className="p-4">
                            <select
                              value={e.status}
                              onChange={(evt) => handleUpdateSellEnquiryStatus(e._id, evt.target.value as any)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                e.status === "PUBLISHED"
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                                  : e.status === "APPROVED"
                                  ? "bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700"
                                  : e.status === "CONTACTED"
                                  ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                                  : e.status === "CLOSED"
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                                  : "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                              }`}
                            >
                              <option value="NEW">NEW</option>
                              <option value="REVIEWING">REVIEWING</option>
                              <option value="CONTACTED">CONTACTED</option>
                              <option value="APPROVED">APPROVED</option>
                              <option value="PUBLISHED">PUBLISHED</option>
                              <option value="CLOSED">CLOSED</option>
                            </select>
                          </td>
                          <td className="p-4 text-right space-x-1.5 flex items-center justify-end whitespace-nowrap">
                            {/* View Full Details Modal Button */}
                            <button
                              onClick={() => setViewingSellEnquiry(e)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition"
                              title="View full plot details and photos"
                            >
                              View Details
                            </button>

                            {/* 1-Click Publish to Catalog */}
                            {e.status !== "PUBLISHED" ? (
                              <button
                                onClick={() => handlePublishSellListing(e)}
                                disabled={publishingEnquiryId === e._id}
                                className="px-3 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition shadow-sm flex items-center gap-1 disabled:opacity-50"
                                title="Publish this seller's plot directly to the live website catalog"
                              >
                                {publishingEnquiryId === e._id ? (
                                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                <span>Publish</span>
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                                ✓ Live
                              </span>
                            )}

                            {/* WhatsApp Connect */}
                            <a
                              href={`https://wa.me/${e.mobileNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                `Hello ${e.fullName}, thank you for submitting your land "${e.plotTitle || "Plot for Sale"}" (Ref: ${e.enquiryReference || "SELL"}) on Nisha Properties. When is a good time to discuss verification and listing?`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1 shadow-sm"
                              title="Chat on WhatsApp"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                              </svg>
                              <span>WhatsApp</span>
                            </a>

                            {/* Direct Call */}
                            <a
                              href={`tel:${e.mobileNumber.replace(/[^0-9]/g, "")}`}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                              title="Call seller"
                            >
                              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </a>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteEnquiry(e._id)}
                              className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 transition"
                              title="Delete submission"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ADD / EDIT PLOT */}
        {activeTab === "add-property" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 shadow-sm">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <img
                  src="https://res.cloudinary.com/dae4jpydb/image/upload/v1786888878/IMG_5090-removebg-preview_t7lceq.png"
                  alt="Nisha Properties Logo"
                  className="h-11 w-11 object-contain shrink-0 drop-shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    {editingPropertyId && (
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        {t("editingModeBadge")}
                      </span>
                    )}
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {editingPropertyId ? `${t("editPlotTitlePrefix")} "${newProp.title || "Plot"}"` : t("publishNewPlotTitle")}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {editingPropertyId
                      ? t("editPlotSubtitle")
                      : t("publishPlotSubtitle")}
                  </p>
                </div>
              </div>
              {editingPropertyId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  {t("cancelEditingBtn")}
                </button>
              )}
            </div>

            {/* GPS & Photo Quick Action Bar */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 mb-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{t("photoGpsAutoCapture")}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t("photoGpsDesc")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {/* Hidden Camera Input with direct device capture */}
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleImageFileChange(e, true)}
                    className="hidden"
                  />

                  {/* Hidden File/Gallery Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, false)}
                    className="hidden"
                  />

                  {/* Button 1: Live Camera Viewfinder with Auto-GPS */}
                  <button
                    type="button"
                    onClick={() => handleOpenLiveCamera()}
                    disabled={uploadingImage || capturingGPS}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2 shadow-md shadow-blue-500/20"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {uploadingImage ? t("uploadingPhotos") : capturingGPS ? t("detectingGps") : t("btnOpenCamera")}
                  </button>

                  {/* Button 2: Normal Files / Gallery Upload */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 dark:hover:bg-slate-600 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t("btnUploadFiles")}
                  </button>

                  {/* Button 3: Standalone GPS Button */}
                  <button
                    type="button"
                    onClick={handleCaptureGPS}
                    disabled={capturingGPS}
                    className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {capturingGPS ? t("detectingGps") : t("btnDetectGps")}
                  </button>
                </div>
              </div>

              {/* Uploaded Thumbnails Preview */}
              {uploadedImages.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2">
                    {t("uploadedPhotosCount")} ({uploadedImages.length}):
                  </span>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {uploadedImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative group shrink-0 w-24 h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700">
                        <img src={imgUrl} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow-md opacity-90 group-hover:opacity-100 transition"
                          title="Remove Photo"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GPS Coordinates Badge & Remove Button */}
              {(gpsData?.latitude || newProp.locationUrl) && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <span>📍</span>
                      <span>{gpsData?.latitude ? t("liveGpsLocked") : t("manualLocationAttached")}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {gpsData?.accuracy ? (
                        <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded">
                          ±{gpsData.accuracy}m Accuracy
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleRemoveLocation}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 transition shadow-sm flex items-center gap-1"
                      >
                        {t("removeAutoLocation")}
                      </button>
                    </div>
                  </div>
                  {gpsData?.latitude ? (
                    <p className="font-mono text-[11px]">
                      Lat: {gpsData.latitude.toFixed(6)} | Lon: {gpsData.longitude?.toFixed(6)}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-3 pt-1">
                    {gpsData?.latitude ? (
                      <a
                        href={getGoogleMapsUrl(gpsData.latitude, gpsData.longitude)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-blue-700 dark:text-blue-400 font-bold underline text-[11px]"
                      >
                        {t("verifyOnGoogleMaps")}
                      </a>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {t("propertyTitle")}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t("propertyTitlePlaceholder")}
                  value={newProp.title}
                  onChange={(e) => setNewProp({ ...newProp, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {t("propertyTypeLabel")}
                  </label>
                  <select
                    value={newProp.propertyType}
                    onChange={(e) => setNewProp({ ...newProp, propertyType: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Agricultural">{t("agricultural")}</option>
                    <option value="Commercial">{t("commercial")}</option>
                    <option value="Residential">{t("residential")}</option>
                    <option value="Industrial">{t("industrial")}</option>
                    <option value="Estate">{t("estate")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {t("priceLabel")}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      placeholder={t("pricePlaceholder")}
                      value={newProp.price}
                      onChange={(e) => setNewProp({ ...newProp, price: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dedicated Land Area Section: First Select Unit, Then Input Value */}
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider mb-1">
                      1. {t("areaUnitLabel")}
                    </label>
                    <select
                      value={newProp.areaUnit || "Acre"}
                      onChange={(e) => setNewProp({ ...newProp, areaUnit: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Acre">Acre (एकड़)</option>
                      <option value="Bigha">Bigha (बीघा)</option>
                      <option value="sqft">Sq. Ft (वर्ग फुट)</option>
                      <option value="Gaj">Gaj / Sq. Yards (गज / वर्ग गज)</option>
                      <option value="Hectare">Hectare (हेक्टेयर)</option>
                      <option value="Guntha">Guntha (गुंठा)</option>
                      <option value="Cent">Cent (सेंट)</option>
                      <option value="Biswa">Biswa (बिस्वा)</option>
                      <option value="Katha">Katha / Kattha (कट्ठा)</option>
                      <option value="Marla">Marla (मरला)</option>
                      <option value="Kanal">Kanal (कनाल)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider mb-1">
                      2. {t("areaValueLabel")}
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder={t("areaPlaceholder")}
                      value={newProp.area}
                      onChange={(e) => setNewProp({ ...newProp, area: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {newProp.area && (
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Total Plot Area: <strong className="font-bold">{newProp.area} {newProp.areaUnit || "Acre"}</strong>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {t("streetAddress")}
                  </label>
                  <input
                    type="text"
                    placeholder="Sector 12 Road"
                    value={newProp.address}
                    onChange={(e) => setNewProp({ ...newProp, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {t("cityLabel")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("cityPlaceholder")}
                    value={newProp.city}
                    onChange={(e) => setNewProp({ ...newProp, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {t("stateLabel")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("statePlaceholder")}
                    value={newProp.state}
                    onChange={(e) => setNewProp({ ...newProp, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t("gpsCoordinatesHeader")}
                  </span>
                  {(gpsData?.latitude || newProp.locationUrl) && (
                    <button
                      type="button"
                      onClick={handleRemoveLocation}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:underline transition flex items-center gap-1"
                    >
                      {t("removeAutoLocation")}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {t("gpsLatitude")}
                    </label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      gpsData?.latitude ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                    }`}>
                      {gpsData?.latitude ? t("autoDetectionActive") : t("inactiveLocked")}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    disabled={!gpsData?.latitude}
                    placeholder={gpsData?.latitude ? "e.g. 12.9716" : t("autoDetectedOnPhotoSnap")}
                    value={gpsData?.latitude !== undefined ? gpsData.latitude : ""}
                    onChange={(e) =>
                      setGpsData((prev) => ({
                        latitude: parseFloat(e.target.value) || 0,
                        longitude: prev?.longitude || 0,
                        source: "MANUAL",
                      }))
                    }
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-mono transition ${
                      gpsData?.latitude
                        ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        : "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    }`}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {t("gpsLongitude")}
                    </label>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      gpsData?.latitude ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                    }`}>
                      {gpsData?.latitude ? t("autoDetectionActive") : t("inactiveLocked")}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    disabled={!gpsData?.latitude}
                    placeholder={gpsData?.latitude ? "e.g. 77.5946" : t("autoDetectedOnPhotoSnap")}
                    value={gpsData?.longitude !== undefined ? gpsData.longitude : ""}
                    onChange={(e) =>
                      setGpsData((prev) => ({
                        latitude: prev?.latitude || 0,
                        longitude: parseFloat(e.target.value) || 0,
                        source: "MANUAL",
                      }))
                    }
                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border font-mono transition ${
                      gpsData?.latitude
                        ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        : "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    }`}
                  />
                </div>
              </div>

              {!gpsData?.latitude && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                  {t("gpsLockHint")}
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {t("manualLocationLink")}
                </label>
                <input
                  type="url"
                  placeholder={t("manualLocationPlaceholder")}
                  value={newProp.locationUrl}
                  onChange={handleLocationUrlChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                  {t("manualLocationHint")}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {t("detailedDescription")}
                </label>
                <textarea
                  rows={4}
                  placeholder={t("descriptionPlaceholder")}
                  value={newProp.description}
                  onChange={(e) => setNewProp({ ...newProp, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={newProp.isFeatured}
                  onChange={(e) => setNewProp({ ...newProp, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <label htmlFor="featuredCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  {t("markAsFeaturedPlot")}
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="py-3 px-5 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  {editingPropertyId ? t("cancelEditingBtn") : t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={creating || uploadingImage}
                  className={`flex-1 py-3 px-5 rounded-xl font-bold text-sm text-white transition shadow-lg ${
                    editingPropertyId
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25"
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25"
                  } disabled:opacity-50`}
                >
                  {creating
                    ? (editingPropertyId ? t("savingChanges") : t("publishingPlot"))
                    : (editingPropertyId ? t("saveChangesBtn") : t("publishPlotBtn"))}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* HIDDEN CANVAS FOR CAMERA SNAPSHOTS */}
      <canvas ref={canvasRef} className="hidden" />

      {/* LIVE IN-APP CAMERA VIEWFINDER MODAL */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
            {/* Viewfinder Header */}
            <div className="p-4 bg-slate-900/90 text-white flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs font-bold uppercase tracking-wider">{t("liveCameraFeed")}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                  title="Switch Front/Rear Camera"
                >
                  {t("flipCamera")}
                </button>
                <button
                  type="button"
                  onClick={handleCloseLiveCamera}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition"
                  title="Close Camera"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Video Viewfinder Area */}
            <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Crosshair Guidelines */}
              <div className="absolute inset-8 pointer-events-none border border-white/30 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/60 rounded-full"></div>
              </div>

              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded-md text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                {t("autoGpsReadyOnSnap")}
              </div>
            </div>

            {/* Viewfinder Bottom Controls */}
            <div className="p-5 bg-slate-900 flex items-center justify-around gap-4">
              <button
                type="button"
                onClick={handleCloseLiveCamera}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                {t("cancel")}
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={handleSnapLiveCamera}
                disabled={uploadingImage}
                className="w-16 h-16 rounded-full border-4 border-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition flex items-center justify-center shadow-lg shadow-blue-500/50"
                title={t("takePhotoShutter")}
              >
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCloseLiveCamera();
                  cameraInputRef.current?.click();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition text-center"
              >
                {t("filePickerFallback")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW SELL ENQUIRY DETAILS MODAL */}
      {viewingSellEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {viewingSellEnquiry.enquiryReference || "SELL-REF"}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {viewingSellEnquiry.plotTitle || "Plot for Sale"}
                </h3>
              </div>
              <button
                onClick={() => setViewingSellEnquiry(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                ✕
              </button>
            </div>

            {/* Grid Specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block font-semibold">Category</span>
                <span className="text-slate-900 dark:text-white font-bold">{viewingSellEnquiry.propertyType || "Agricultural"}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block font-semibold">Expected Price</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {viewingSellEnquiry.expectedPrice ? `₹${Number(viewingSellEnquiry.expectedPrice).toLocaleString("en-IN")}` : "On Request"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block font-semibold">Total Area</span>
                <span className="text-slate-900 dark:text-white font-bold">{viewingSellEnquiry.area || "—"} {viewingSellEnquiry.areaUnit || "Acre"}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block font-semibold">City / District</span>
                <span className="text-slate-900 dark:text-white font-bold">{viewingSellEnquiry.city || viewingSellEnquiry.place || "—"}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block font-semibold">State</span>
                <span className="text-slate-900 dark:text-white font-bold">{viewingSellEnquiry.state || "Madhya Pradesh"}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block font-semibold">Pincode</span>
                <span className="text-slate-900 dark:text-white font-bold">{viewingSellEnquiry.postalCode || "—"}</span>
              </div>
            </div>

            {/* Seller Information */}
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-2 text-xs">
              <span className="font-extrabold text-blue-900 dark:text-blue-300 block uppercase tracking-wider text-[11px]">
                Seller Contact Information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800 dark:text-slate-200 font-medium">
                <div><strong>Name:</strong> {viewingSellEnquiry.fullName}</div>
                <div><strong>Mobile:</strong> {viewingSellEnquiry.mobileNumber}</div>
                <div><strong>Email:</strong> {viewingSellEnquiry.email}</div>
                <div><strong>Seller Place:</strong> {viewingSellEnquiry.place || viewingSellEnquiry.city || "—"}</div>
              </div>
            </div>

            {/* Description */}
            {viewingSellEnquiry.description && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Description & Highlights</h4>
                <p className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {viewingSellEnquiry.description}
                </p>
              </div>
            )}

            {/* Photos Gallery */}
            {viewingSellEnquiry.images && viewingSellEnquiry.images.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Plot Photos ({viewingSellEnquiry.images.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {viewingSellEnquiry.images.map((img, idx) => (
                    <a key={idx} href={img} target="_blank" rel="noreferrer" className="rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-700 group relative">
                      <img src={img} alt={`Plot ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => setViewingSellEnquiry(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
              {viewingSellEnquiry.status !== "PUBLISHED" && (
                <button
                  onClick={() => {
                    const item = viewingSellEnquiry;
                    setViewingSellEnquiry(null);
                    handlePublishSellListing(item);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md"
                >
                  ✨ Publish to Live Catalog
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;