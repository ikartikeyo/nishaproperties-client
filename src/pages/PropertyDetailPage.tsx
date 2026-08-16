import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import EnquiryForm from "../components/EnquiryForm";
import {
  getGoogleMapsUrl,
  getGoogleDirectionsUrl,
  getOpenStreetMapEmbedUrl,
  getEffectiveLocationUrl,
} from "../utils/geo";
import { useLanguage } from "../contexts/LanguageContext";

const defaultImage = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80";

const PropertyDetailPage: React.FC = () => {
  const { id, propertyId } = useParams();
  const effectiveId = id || propertyId;
  const { t } = useLanguage();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(defaultImage);
  const [copiedCoords, setCopiedCoords] = useState(false);

  useEffect(() => {
    if (!effectiveId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/property/${effectiveId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load property details (HTTP ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        const item = data.data || data;
        setProperty(item);
        if (item?.images && item.images.length > 0) {
          setSelectedImage(item.images[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch detail error:", err);
        setError(err.message || "Failed to load plot details");
        setLoading(false);
      });
  }, [effectiveId]);

  const handleCopyCoordinates = () => {
    if (!property?.latitude || !property?.longitude) return;
    const text = `${property.latitude.toFixed(6)}, ${property.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t("loadingProperties")}</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">{error || "Property Not Found"}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">The property you are looking for might have been moved or removed.</p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            {t("backToAllProperties")}
          </Link>
        </div>
      </div>
    );
  }

  const effectiveLocationLink = getEffectiveLocationUrl(property);
  const hasGPS = property.latitude !== undefined && property.longitude !== undefined;
  const hasLocation = hasGPS || Boolean(effectiveLocationLink);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-6">
          <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition">{t("home")}</Link>
          <span>/</span>
          <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition">{t("properties")}</Link>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200 truncate max-w-xs">{property.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-[#1E293B] aspect-video shadow-md">
              <img
                src={selectedImage}
                alt={property.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultImage;
                }}
              />
              <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/90 dark:bg-[#0F172A]/90 text-slate-900 dark:text-white backdrop-blur shadow">
                  {property.propertyType || "Land Plot"}
                </span>
                {hasLocation && (
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow flex items-center gap-1">
                    {t("locationVerified")}
                  </span>
                )}
                {property.isFeatured && (
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 text-white shadow">
                    {t("featuredBadge")}
                  </span>
                )}
              </div>
            </div>

            {/* Gallery Thumbnails */}
            {property.images && property.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {property.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`relative rounded-xl overflow-hidden w-24 h-16 shrink-0 border-2 transition ${
                      selectedImage === img ? "border-blue-600 scale-105" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Title & Description */}
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                {property.title}
              </h1>

              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm mb-6">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  {property.address ? `${property.address}, ` : ""}
                  {property.city ? `${property.city}, ` : ""}
                  {property.state || ""} {property.postalCode ? `- ${property.postalCode}` : ""}
                </span>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{t("overviewLandDescription")}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {property.description || t("noDescription")}
                </p>
              </div>
            </div>

            {/* EXACT GPS / MANUAL LOCATION & INTERACTIVE MAP (CONSUMER NAVIGATION) */}
            {hasLocation && (
              <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      {hasGPS ? t("verifiedOnSiteGps") : t("locationLinkAvailable")}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{t("landLocationNavigation")}</h3>
                  </div>
                  {property.locationAccuracy ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-[#1E293B] px-3 py-1.5 rounded-lg">
                      Precision: ±{property.locationAccuracy}m ({property.locationSource || "DEVICE_GPS"})
                    </span>
                  ) : null}
                </div>

                {/* Embedded Interactive Map if coordinates present */}
                {hasGPS && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-64 w-full bg-slate-100 dark:bg-[#1E293B] relative shadow-inner">
                    <iframe
                      title="Property Location Map"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={getOpenStreetMapEmbedUrl(property.latitude, property.longitude)}
                      className="w-full h-full"
                    ></iframe>
                  </div>
                )}

                {/* Coordinates & Consumer Action Buttons */}
                <div className="bg-slate-50 dark:bg-[#1E293B]/70 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block uppercase">{t("landLocationPin")}</span>
                    <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                      {hasGPS
                        ? `${property.latitude.toFixed(6)}, ${property.longitude.toFixed(6)}`
                        : property.city || property.address || "Google Maps Location Link"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {hasGPS && (
                      <button
                        onClick={handleCopyCoordinates}
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition shadow-sm"
                      >
                        {copiedCoords ? t("copied") : t("copyGps")}
                      </button>
                    )}
                    {hasGPS && (
                      <a
                        href={getGoogleDirectionsUrl(property.latitude, property.longitude, property.locationUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-slate-900 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 transition shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4 text-emerald-700 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t("drivingDirections")}
                      </a>
                    )}
                    {effectiveLocationLink && (
                      <a
                        href={effectiveLocationLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {t("openInGoogleMaps")}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Property Key Highlights */}
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t("propertyDetails")}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">{t("totalArea")}</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                    {property.area?.toLocaleString()} {property.areaUnit || "sqft"}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">{t("colType")}</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                    {property.propertyType || "Land Plot"}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E293B]/70 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">{t("status")}</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {property.status || "ACTIVE"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Price Card & Enquiry Box */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm sticky top-24 space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                  {t("offeredPrice")}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {property.price ? `₹${property.price.toLocaleString("en-IN")}` : t("uponRequest")}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("inr")}</span>
                </div>
              </div>

              {/* Exact Location Link inside Price Box */}
              {effectiveLocationLink && (
                <a
                  href={effectiveLocationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span>{t("viewExactLocationMaps")}</span>
                </a>
              )}

              <div className="py-3 px-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs space-y-1">
                <p className="font-semibold">{t("verifiedTitleDeed")}</p>
                <p className="font-semibold">{t("directLandlordSupport")}</p>
                <p className="font-semibold">{t("gpsCoordinatesChecked")}</p>
              </div>

              <button
                onClick={() => setIsEnquiryOpen(true)}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {t("sendEnquiry")}
              </button>

              {/* Direct WhatsApp Chat with Dealer Button */}
              <a
                href={`https://wa.me/918839041639?text=${encodeURIComponent(
                  `Hello Dealer, I am interested in "${property.title}" (Price: ₹${property.price ? property.price.toLocaleString("en-IN") : "N/A"}). Please provide more details.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                {t("chatOnWhatsApp")}
              </a>

              <div className="pt-2 text-center">
                <Link to="/" className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition">
                  {t("backToAllProperties")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      <EnquiryForm
        isOpen={isEnquiryOpen}
        setIsOpen={setIsEnquiryOpen}
        landId={property._id}
        landTitle={property.title}
      />
    </div>
  );
};

export default PropertyDetailPage;