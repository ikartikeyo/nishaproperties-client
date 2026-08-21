import React, { useEffect, useState, useRef } from "react";
import PropertyCard, { Property } from "../components/PropertyCard";
import { useLanguage } from "../contexts/LanguageContext";
import {
  searchCitySuggestions,
  CitySuggestion,
  getCurrentGPSCoordinates,
  reverseGeocodeCoordinates,
} from "../utils/geo";

const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters & Geolocation Suggestions
  const [searchTerm, setSearchTerm] = useState("");
  const [propertyType, setPropertyType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const fetchProperties = () => {
    setIsLoading(true);
    setApiError(null);

    fetch("/api/property?limit=100")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} - Backend API issue`);
        }
        return res.json();
      })
      .then((data) => {
        // Backend returns { success: true, data: [...] } or array directly
        const list = Array.isArray(data) ? data : data.data || [];
        setProperties(list);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Property fetch error:", error);
        setIsLoading(false);
        setApiError(error.message || "Failed to load properties");
      });
  };

  // General Enquiry Form State
  const [enqForm, setEnqForm] = useState({
    fullName: "",
    place: "",
    mobileNumber: "",
    email: "",
    message: "",
  });
  const [enqSubmitting, setEnqSubmitting] = useState(false);
  const [enqSuccess, setEnqSuccess] = useState<{
    referenceNumber: string;
    consumerToAdminWhatsAppLink?: string;
  } | null>(null);
  const [enqError, setEnqError] = useState<string | null>(null);

  const handleGeneralEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnqSubmitting(true);
    setEnqError(null);
    setEnqSuccess(null);

    try {
      const payload = {
        enquiryReference: `ENQ-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`,
        fullName: enqForm.fullName,
        mobileNumber: enqForm.mobileNumber,
        email: enqForm.email,
        place: enqForm.place,
        message: enqForm.message,
        propertyNameSnapshot: "General / Other Land Enquiry",
      };

      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEnqSuccess({
          referenceNumber: data.data?.enquiryReference || "ENQ-SUCCESS",
          consumerToAdminWhatsAppLink: data.whatsappLinks?.consumerToAdminLink,
        });
        setEnqForm({
          fullName: "",
          place: "",
          mobileNumber: "",
          email: "",
          message: "",
        });
      } else {
        setEnqError(data.message || "Failed to submit enquiry. Please try again.");
      }
    } catch (err: any) {
      setEnqError("Network error. Please try again.");
    } finally {
      setEnqSubmitting(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Debounced City & Geolocation Autocomplete
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const localCities = Array.from(
        new Set(
          properties
            .map((p) => p.city)
            .filter((c): c is string => Boolean(c && c.trim()))
        )
      );
      const suggestions = await searchCitySuggestions(searchTerm, localCities);
      setCitySuggestions(suggestions);
      if (suggestions.length > 0) {
        setShowSuggestions(true);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, properties]);

  // Click outside to dismiss suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Browser GPS auto-detect city
  const handleAutoLocate = async () => {
    setIsLocating(true);
    try {
      const coords = await getCurrentGPSCoordinates();
      const info = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
      if (info.city) {
        setSearchTerm(info.city);
        setShowSuggestions(false);
      } else if (info.state) {
        setSearchTerm(info.state);
        setShowSuggestions(false);
      }
    } catch (err: any) {
      console.warn("GPS location auto-detect error:", err);
    } finally {
      setIsLocating(false);
    }
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      propertyType === "all" ||
      p.propertyType?.toLowerCase() === propertyType.toLowerCase();

    return matchesSearch && matchesType;
  }).sort((a, b) => {
    if (sortBy === "price-low") return (a.price || 0) - (b.price || 0);
    if (sortBy === "price-high") return (b.price || 0) - (a.price || 0);
    if (sortBy === "area") return (b.area || 0) - (a.area || 0);
    return 0; // default order from server
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Non-infinity Hero Section with Responsive Padding & Border Curve */}
      <div className="px-3.5 sm:px-6 lg:px-8 pt-3 sm:pt-6">
        <section className="relative max-w-7xl mx-auto rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-b from-[#070D18] via-[#0B132B] to-[#070D18] text-white py-10 sm:py-16 md:py-20 px-3.5 sm:px-8 lg:px-12 overflow-hidden border border-slate-800 shadow-2xl">
          {/* Ambient Glowing Background Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute top-1/3 right-1/4 w-[350px] h-[250px] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none"></div>

          {/* Subtle Geometric Overlay */}
          <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

          <div className="relative max-w-5xl mx-auto text-center">
            {/* Glassmorphic Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-blue-200 shadow-lg mb-4 sm:mb-6 transition-all">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>{t("heroBadge")}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-3 sm:mb-5 drop-shadow-sm">
              {t("heroTitlePrefix")}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-300 to-indigo-300">
                {t("heroTitleHighlight")}
              </span>
            </h1>

            <p className="text-xs sm:text-base lg:text-lg text-slate-300/90 max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed font-normal drop-shadow-sm">
              {t("heroSubtitle")}
            </p>

            {/* 60% Transparent Glassmorphic Search Filter Bar */}
            <div className="bg-slate-900/40 backdrop-blur-xl p-2.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-2xl border border-white/15 text-slate-100 max-w-4xl mx-auto transition-all hover:border-white/25">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
                {/* Keyword & City Geolocation Search */}
                <div ref={searchContainerRef} className="relative">
                  <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-300">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={searchTerm}
                    onFocus={() => {
                      if (citySuggestions.length > 0) setShowSuggestions(true);
                    }}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-20 py-3 text-sm rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 focus:border-cyan-400/60 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/40 backdrop-blur-md transition shadow-inner"
                  />

                  {/* Geolocator & Clear Controls */}
                  <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setCitySuggestions([]);
                          setShowSuggestions(false);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                        title="Clear Search"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleAutoLocate}
                      disabled={isLocating}
                      className="p-1.5 rounded-lg text-cyan-300 hover:text-white hover:bg-cyan-500/20 transition flex items-center justify-center"
                      title="Use My Current Location (GPS Auto-detect City)"
                    >
                      {isLocating ? (
                        <svg className="w-4 h-4 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Similar Cities Suggestions Dropdown */}
                  {showSuggestions && citySuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0B132B]/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn text-left">
                      <div className="px-3.5 py-2 border-b border-white/10 text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                        <span>Similar Cities & Locations</span>
                        <button
                          type="button"
                          onClick={() => setShowSuggestions(false)}
                          className="text-slate-400 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="max-h-56 overflow-y-auto custom-city-scroller divide-y divide-white/5 pr-1">
                        {citySuggestions.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSearchTerm(item.city);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-3.5 py-2.5 text-xs text-slate-100 hover:bg-white/15 transition flex items-center gap-2.5 group"
                          >
                            <svg className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div className="truncate">
                              <span className="font-bold text-white">{item.city}</span>
                              {item.state && (
                                <span className="text-slate-400 text-[11px] ml-1.5 font-normal">({item.state})</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Property Type Selector */}
                <div>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full px-3.5 py-3 text-sm rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 focus:border-cyan-400/60 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40 backdrop-blur-md transition shadow-inner font-medium"
                  >
                    <option value="all" className="bg-[#0B132B] text-white">{t("allTypes")}</option>
                    <option value="Agricultural" className="bg-[#0B132B] text-white">{t("agricultural")}</option>
                    <option value="Commercial" className="bg-[#0B132B] text-white">{t("commercial")}</option>
                    <option value="Residential" className="bg-[#0B132B] text-white">{t("residential")}</option>
                    <option value="Industrial" className="bg-[#0B132B] text-white">{t("industrial")}</option>
                    <option value="Estate" className="bg-[#0B132B] text-white">{t("estate")}</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3.5 py-3 text-sm rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 focus:border-cyan-400/60 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/40 backdrop-blur-md transition shadow-inner font-medium"
                  >
                    <option value="newest" className="bg-[#0B132B] text-white">{t("sortNewest")}</option>
                    <option value="price-low" className="bg-[#0B132B] text-white">{t("sortPriceLow")}</option>
                    <option value="price-high" className="bg-[#0B132B] text-white">{t("sortPriceHigh")}</option>
                    <option value="area" className="bg-[#0B132B] text-white">{t("sortArea")}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Main Listings Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t("featuredListings")}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t("showingProperties")} ({filteredProperties.length})</p>
          </div>
          {(searchTerm || propertyType !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setPropertyType("all");
              }}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-lg transition"
            >
              {t("resetFilters")}
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
                <div className="h-48 bg-slate-200 dark:bg-[#1E293B] rounded-xl mb-4"></div>
                <div className="h-5 bg-slate-200 dark:bg-[#1E293B] rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-200 dark:bg-[#1E293B] rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-slate-200 dark:bg-[#1E293B] rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && apiError && (
          <div className="max-w-xl mx-auto p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200 mb-1">Backend Connection Error</h3>
            <p className="text-sm text-rose-700 dark:text-rose-300 mb-4">{apiError}</p>
            <button
              onClick={fetchProperties}
              className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition"
            >
              Retry Loading Listings
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !apiError && filteredProperties.length === 0 && (
          <div className="max-w-md mx-auto py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-500 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">{t("noPropertiesFound")}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {t("emptyStateDesc")}
            </p>
            <div className="flex justify-center gap-3">
              <a
                href="/admin"
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
              >
                {t("addFirstPlotAdmin")}
              </a>
            </div>
          </div>
        )}

        {/* Listings Grid */}
        {!isLoading && !apiError && filteredProperties.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((prop) => (
              <PropertyCard key={prop._id} property={prop} />
            ))}
          </div>
        )}

        {/* General / Other Enquiry Form Section */}
        <section id="general-enquiry-section" className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800 scroll-mt-24">
          <div className="max-w-3xl mx-auto bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-lg transition-colors">
            <div className="text-center max-w-xl mx-auto mb-8">
              <img
                src="https://res.cloudinary.com/dae4jpydb/image/upload/v1786888878/IMG_5090-removebg-preview_t7lceq.png"
                alt="Nisha Properties Logo"
                className="h-14 w-14 object-contain mx-auto mb-3 drop-shadow-sm"
              />
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 mb-2">
                {t("sendEnquiry")}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t("generalEnquiryTitle")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {t("generalEnquirySubtitle")}
              </p>

              {/* Direct Phone & WhatsApp Helpline Banner */}
              <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-3 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-2">
                  {t("directHelpline")}
                </span>
                <a
                  href="tel:+918839041639"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition flex items-center gap-1.5"
                  title="Call Directly"
                >
                  <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+91-8839041639</span>
                </a>
                <a
                  href="https://wa.me/918839041639?text=Hello%20Dealer%2C%20I%20have%20an%20enquiry%20regarding%20land%20plots."
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition flex items-center gap-1.5"
                  title="Chat on WhatsApp"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {enqSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-4 animate-fadeIn">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                    {t("enquirySentSuccess")}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                    {t("enquiryRefNumber")}: <strong className="font-mono">{enqSuccess.referenceNumber}</strong>
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  {enqSuccess.consumerToAdminWhatsAppLink && (
                    <a
                      href={enqSuccess.consumerToAdminWhatsAppLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                    >
                      <span>{t("chatOnWhatsApp")}</span>
                    </a>
                  )}
                  <button
                    onClick={() => setEnqSuccess(null)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGeneralEnquirySubmit} className="space-y-4">
                {enqError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                    {enqError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {t("fullName")} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t("fullNamePlaceholder")}
                      value={enqForm.fullName}
                      onChange={(e) => setEnqForm({ ...enqForm, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {t("cityPlace")} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t("placePlaceholder")}
                      value={enqForm.place}
                      onChange={(e) => setEnqForm({ ...enqForm, place: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {t("mobileNumber")} *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder={t("mobilePlaceholder")}
                      value={enqForm.mobileNumber}
                      onChange={(e) => setEnqForm({ ...enqForm, mobileNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {t("emailAddress")} *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder={t("emailPlaceholder")}
                      value={enqForm.email}
                      onChange={(e) => setEnqForm({ ...enqForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {t("messageOptional")}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us what size, location, or land type you are looking for..."
                    value={enqForm.message}
                    onChange={(e) => setEnqForm({ ...enqForm, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={enqSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {enqSubmitting ? t("submittingEnquiry") : t("sendGeneralEnquiryBtn")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;