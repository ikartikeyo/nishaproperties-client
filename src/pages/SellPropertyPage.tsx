import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import {
  getCurrentGPSCoordinates,
  reverseGeocodeCoordinates,
  getGoogleMapsUrl,
} from "../utils/geo";

const AREA_UNITS = [
  "Acre",
  "Bigha",
  "Gaj",
  "sqft",
  "Hectare",
  "Guntha",
  "Cent",
  "Biswa",
  "Katha",
  "Marla",
  "Kanal",
];

const PROPERTY_TYPES = [
  { value: "Agricultural", labelEn: "Agricultural Land", labelHi: "कृषि भूमि (खेती)" },
  { value: "Commercial", labelEn: "Commercial Plot", labelHi: "व्यावसायिक भूखंड (कॉमर्शियल)" },
  { value: "Residential", labelEn: "Residential Plot", labelHi: "आवासीय भूखंड (रेजिडेंशियल)" },
  { value: "Industrial", labelEn: "Industrial Plot", labelHi: "औद्योगिक भूखंड (इंडस्ट्रियल)" },
  { value: "Estate", labelEn: "Farmhouse / Estate", labelHi: "फार्महाउस / एस्टेट" },
];

const INDIAN_STATES = [
  "Madhya Pradesh",
  "Uttar Pradesh",
  "Maharashtra",
  "Rajasthan",
  "Gujarat",
  "Chhattisgarh",
  "Delhi",
  "Haryana",
  "Punjab",
  "Bihar",
  "Karnataka",
  "Telangana",
  "Tamil Nadu",
  "West Bengal",
  "Odisha",
  "Jharkhand",
  "Uttarakhand",
  "Himachal Pradesh",
  "Other",
];

const SellPropertyPage: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  // Seller Details
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [sellerPlace, setSellerPlace] = useState("");

  // Plot Details
  const [plotTitle, setPlotTitle] = useState("");
  const [propertyType, setPropertyType] = useState("Agricultural");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [area, setArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("Acre");

  // Location & Address
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Madhya Pradesh");
  const [postalCode, setPostalCode] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [description, setDescription] = useState("");

  // GPS State
  const [gpsData, setGpsData] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    source?: string;
  } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Photos State
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    enquiryReference: string;
    whatsappLink?: string;
    plotTitle: string;
  } | null>(null);

  // Handle GPS Capture
  const handleCaptureGPS = async () => {
    setGpsLoading(true);
    setGpsError(null);
    try {
      const coords = await getCurrentGPSCoordinates();
      setGpsData({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        source: "DEVICE_GPS",
      });

      // Auto-set Google Maps URL
      const mapsUrl = getGoogleMapsUrl(coords.latitude, coords.longitude);
      if (!locationUrl) {
        setLocationUrl(mapsUrl);
      }

      // Reverse geocode to city and state
      try {
        const geoInfo = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
        if (geoInfo.city && !city) setCity(geoInfo.city);
        if (geoInfo.state && !state) setState(geoInfo.state);
        if (geoInfo.postalCode && !postalCode) setPostalCode(geoInfo.postalCode);
        if (geoInfo.address && !address) setAddress(geoInfo.address);
      } catch (err) {
        console.warn("Reverse geocode warning:", err);
      }
    } catch (err: any) {
      setGpsError(err.message || "Failed to retrieve GPS location. Please ensure location is enabled.");
    } finally {
      setGpsLoading(false);
    }
  };

  // Handle Multiple Image Uploads
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setErrorMsg(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }

    try {
      const res = await fetch("/api/property/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data.urls)) {
        setImages((prev) => [...prev, ...data.data.urls]);
      } else {
        // Fallback: Read as base64 for instant preview
        for (let i = 0; i < files.length; i++) {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            if (uploadEvent.target?.result) {
              setImages((prev) => [...prev, uploadEvent.target!.result as string]);
            }
          };
          reader.readAsDataURL(files[i]);
        }
      }
    } catch (err) {
      console.warn("Server upload failed, converting to local preview:", err);
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          if (uploadEvent.target?.result) {
            setImages((prev) => [...prev, uploadEvent.target!.result as string]);
          }
        };
        reader.readAsDataURL(files[i]);
      }
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  // Remove Photo
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !mobileNumber.trim()) {
      setErrorMsg("Please provide your full name and mobile phone number.");
      return;
    }

    if (!plotTitle.trim()) {
      setErrorMsg("Please enter a title or headline for your land plot.");
      return;
    }

    if (!area || Number(area) <= 0) {
      setErrorMsg("Please enter the total land area.");
      return;
    }

    if (!city.trim()) {
      setErrorMsg("Please specify the city/district of the land plot.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        enquiryType: "SELL_LISTING",
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim() || "seller@nishaproperties.com",
        place: sellerPlace.trim() || city.trim(),
        plotTitle: plotTitle.trim(),
        propertyType,
        expectedPrice: Number(expectedPrice) || 0,
        area: Number(area) || 0,
        areaUnit,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        description: description.trim(),
        locationUrl: locationUrl.trim() || (gpsData ? getGoogleMapsUrl(gpsData.latitude, gpsData.longitude) : ""),
        latitude: gpsData?.latitude,
        longitude: gpsData?.longitude,
        locationAccuracy: gpsData?.accuracy,
        locationSource: gpsData?.source || "DEVICE_GPS",
        images,
      };

      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit land details. Please try again.");
      }

      setSubmissionSuccess({
        enquiryReference: data.data?.enquiryReference || "SELL-REF",
        whatsappLink: data.data?.whatsappLink,
        plotTitle: plotTitle.trim(),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Format INR for price display helper
  const formattedExpectedPrice = expectedPrice && !isNaN(Number(expectedPrice))
    ? Number(expectedPrice).toLocaleString("en-IN")
    : null;

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-slate-50 dark:bg-[#070D18] transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
            {t("home")}
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-bold">{t("sellLand")}</span>
        </div>

        {/* Success State Screen */}
        {submissionSuccess ? (
          <div className="bg-white dark:bg-[#0F172A] rounded-3xl p-8 sm:p-12 border border-emerald-200 dark:border-emerald-800/60 shadow-xl text-center animate-fadeIn">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 shadow-inner">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 inline-block mb-3">
              {t("sellListingSuccess") || "Listing Submitted Successfully"}
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              {submissionSuccess.plotTitle}
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto mb-6 leading-relaxed">
              Thank you, <strong className="text-slate-900 dark:text-white">{fullName}</strong>! Your land details have been securely recorded with reference ID:
            </p>

            <div className="inline-block px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-lg mb-8 shadow-sm">
              {submissionSuccess.enquiryReference}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {submissionSuccess.whatsappLink && (
                <a
                  href={submissionSuccess.whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25 transition active:scale-95"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  <span>Chat with Dealer on WhatsApp</span>
                </a>
              )}
              <a
                href="tel:+918839041639"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-300 dark:border-slate-700 transition"
              >
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Call Hotline (+91-8839041639)</span>
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setSubmissionSuccess(null);
                  setPlotTitle("");
                  setExpectedPrice("");
                  setArea("");
                  setAddress("");
                  setDescription("");
                  setImages([]);
                  setGpsData(null);
                }}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                + List Another Land Plot
              </button>
            </div>
          </div>
        ) : (
          /* Main Sell Form */
          <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            {/* Header Banner */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md mb-2">
                    {t("sellLandNavBadge") || "Free Landowner Listing"}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {t("sellLandTitle")}
                  </h1>
                  <p className="text-xs sm:text-sm text-emerald-50 mt-1 max-w-xl leading-relaxed">
                    {t("sellLandSubtitle")}
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-100">
                    Direct Helpline
                  </span>
                  <a
                    href="tel:+918839041639"
                    className="text-lg font-black text-white hover:underline flex items-center gap-1.5"
                  >
                    +91-8839041639
                  </a>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
              {/* 1. SELLER CONTACT INFORMATION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center">
                    1
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {language === "hi" ? "आपकी संपर्क जानकारी (विक्रेता)" : "Your Contact Information (Landowner / Seller)"}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("fullName")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Chandra Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("mobileNumber")} (WhatsApp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t("emailAddress")}
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. ramesh@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === "hi" ? "आपका गृह स्थान / शहर" : "Your Current City / Place"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bhopal, MP"
                      value={sellerPlace}
                      onChange={(e) => setSellerPlace(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. PLOT SPECIFICATIONS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center">
                    2
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {language === "hi" ? "जमीन / भूखंड की विशेषताएं" : "Land & Plot Specifications"}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === "hi" ? "प्लॉट शीर्षक / मुख्य विवरण" : "Land Plot Title / Headline"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5 Acre Fertile Agricultural Farm Land near Highway"
                      value={plotTitle}
                      onChange={(e) => setPlotTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === "hi" ? "जमीन का प्रकार" : "Property Category / Type"}
                    </label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {PROPERTY_TYPES.map((pt) => (
                        <option key={pt.value} value={pt.value}>
                          {language === "hi" ? pt.labelHi : pt.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === "hi" ? "अपेक्षित मूल्य (₹ INR)" : "Expected Price (₹ INR)"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        ₹
                      </span>
                      <input
                        type="number"
                        placeholder="e.g. 2500000"
                        value={expectedPrice}
                        onChange={(e) => setExpectedPrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    {formattedExpectedPrice && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                        ₹ {formattedExpectedPrice} INR
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === "hi" ? "कुल क्षेत्रफल" : "Total Land Area"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 4.5"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === "hi" ? "क्षेत्रफल इकाई" : "Area Measurement Unit"}
                    </label>
                    <select
                      value={areaUnit}
                      onChange={(e) => setAreaUnit(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {AREA_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. LOCATION & GPS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-black text-xs flex items-center justify-center">
                      3
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {language === "hi" ? "स्थान एवं जीपीएस नेविगेशन" : "Land Location & GPS Coordinates"}
                    </h3>
                  </div>

                  {/* 1-Click GPS Button */}
                  <button
                    type="button"
                    onClick={handleCaptureGPS}
                    disabled={gpsLoading}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 hover:bg-purple-100 transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    {gpsLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    <span>{gpsLoading ? "Detecting GPS..." : "Auto-Detect My GPS"}</span>
                  </button>
                </div>

                {gpsError && (
                  <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
                    {gpsError}
                  </p>
                )}

                {gpsData && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-purple-900 dark:text-purple-300">
                        GPS Captured: {gpsData.latitude.toFixed(5)}, {gpsData.longitude.toFixed(5)}
                      </span>
                      {gpsData.accuracy && (
                        <span className="block text-[11px] text-purple-700 dark:text-purple-400">
                          Precision Accuracy: ±{gpsData.accuracy}m
                        </span>
                      )}
                    </div>
                    <a
                      href={getGoogleMapsUrl(gpsData.latitude, gpsData.longitude)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-purple-900 text-purple-700 dark:text-purple-200 font-bold text-[11px] border border-purple-300 shadow-sm"
                    >
                      View on Map ↗
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === "hi" ? "सड़क / ग्राम / स्थल का पता" : "Street / Village / Landmark Address"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Village Ratibad, Near Main Canal Road"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === "hi" ? "शहर / जिला" : "City / District"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bhopal"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === "hi" ? "राज्य" : "State"}
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === "hi" ? "पिन कोड" : "Postal Code / PIN"}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 462003"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {language === "hi" ? "गूगल मैप्स लिंक (वैकल्पिक)" : "Google Maps Link (Optional)"}
                    </label>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/..."
                      value={locationUrl}
                      onChange={(e) => setLocationUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. DESCRIPTION & HIGHLIGHTS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-black text-xs flex items-center justify-center">
                    4
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {language === "hi" ? "भूमि विवरण एवं मुख्य बिंदु" : "Land Description & Key Features"}
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === "hi" ? "प्लॉट के बारे में विस्तार से बताएं (सड़क, पानी, रजिस्ट्री आदि)" : "Detailed Overview (Road width, water source, registry status, electricity, fencing)"}
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Clear title deed with single owner. 40 ft paved road access, borewell installed, fertile black soil ideal for organic farming or future plotting."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* 5. PHOTOS & GALLERY */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-7 h-7 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 font-black text-xs flex items-center justify-center">
                    5
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {language === "hi" ? "प्लॉट की तस्वीरें (वैकल्पिक)" : "Land Photos & Media (Optional)"}
                  </h3>
                </div>

                <div>
                  <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 rounded-2xl cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 transition">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="sr-only"
                    />
                    <svg className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {uploadingImages ? "Uploading photos..." : "Click to select or drag land photos here"}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      JPG, PNG, WEBP (Up to 10 photos)
                    </span>
                  </label>

                  {/* Thumbnail Gallery Preview */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4">
                      {images.map((imgUrl, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 dark:border-slate-700 shadow-sm">
                          <img src={imgUrl} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100 transition shadow"
                            title="Remove photo"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
                  By submitting, you agree to allow Nisha Properties to list and verify this property.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 shadow-lg shadow-emerald-600/25 transition active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Submitting Land Listing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{t("submitSellListing") || "Submit Land for Sale"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellPropertyPage;
