import React from "react";
import { Link } from "react-router-dom";
import { getGoogleMapsUrl, getEffectiveLocationUrl } from "../utils/geo";
import { useLanguage } from "../contexts/LanguageContext";

export interface Property {
  _id: string;
  title: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  price: number;
  area: number;
  areaUnit?: string;
  propertyType?: string;
  images?: string[];
  isFeatured?: boolean;
  status?: string;
  locationUrl?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  locationSource?: string;
}

const defaultImage = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";

const PropertyCard: React.FC<{ property: Property }> = ({ property }) => {
  const { t } = useLanguage();
  const imageUrl = property.images && property.images.length > 0 ? property.images[0] : defaultImage;
  const locationText = property.city && property.state ? `${property.city}, ${property.state}` : property.location || property.address || "Prime Location";
  const locationLink = getEffectiveLocationUrl(property);
  const hasGPS = (property.latitude !== undefined && property.longitude !== undefined) || Boolean(property.locationUrl);

  return (
    <div className="group bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Image and Badges */}
      <div className="relative h-56 w-full overflow-hidden bg-slate-100 dark:bg-[#1E293B]">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur text-slate-800 dark:text-slate-200 shadow">
            {property.propertyType || "Land Plot"}
          </span>
          <div className="flex gap-1.5">
            {hasGPS && (
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md bg-emerald-600 text-white shadow flex items-center gap-1">
                {t("gpsTagged")}
              </span>
            )}
            {property.isFeatured && (
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md bg-amber-500 text-white shadow flex items-center gap-1">
                {t("featuredBadge")}
              </span>
            )}
          </div>
        </div>

        {/* Price on Image */}
        <div className="absolute bottom-3 left-3">
          <span className="text-xl font-extrabold text-white drop-shadow-md">
            {property.price ? `₹${property.price.toLocaleString("en-IN")}` : t("contactForPrice")}
          </span>
          <span className="text-xs text-white/80 ml-1 font-medium">{t("inr")}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
            {property.title}
          </h3>

          <div className="flex items-center gap-1.5 mt-2 text-slate-500 dark:text-slate-400 text-sm">
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{locationText}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="bg-slate-50 dark:bg-[#1E293B]/70 p-2 rounded-lg">
              <span className="text-slate-400 dark:text-slate-500 block font-medium">{t("totalArea")}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{property.area?.toLocaleString()} {property.areaUnit || "sqft"}</span>
            </div>
            <div className="bg-slate-50 dark:bg-[#1E293B]/70 p-2 rounded-lg">
              <span className="text-slate-400 dark:text-slate-500 block font-medium">{t("status")}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{property.status || "ACTIVE"}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-5 space-y-2">
          {locationLink && (
            <a
              href={locationLink}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-xl text-center font-bold text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-200 dark:border-emerald-800 transition flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t("viewExactLocationMaps")}
            </a>
          )}

          <Link
            to={`/properties/${property._id}`}
            className="w-full py-2.5 px-4 rounded-xl text-center font-semibold text-sm bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all duration-200 block"
          >
            {t("viewDetailsEnquiry")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;