import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const handleScrollToEnquiry = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("general-enquiry-section");
    if (target && (location.pathname === "/" || location.pathname === "/properties")) {
      target.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        document.getElementById("general-enquiry-section")?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  };

  return (
    <footer className="mt-auto bg-white dark:bg-[#070D18] border-t border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="https://res.cloudinary.com/dae4jpydb/image/upload/v1786888878/IMG_5090-removebg-preview_t7lceq.png"
                alt="Nisha Properties Logo"
                className="h-11 w-11 object-contain group-hover:scale-105 transition-transform drop-shadow-sm"
              />
              <div>
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight block">
                  {t("brandName")}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase block -mt-0.5">
                  {t("brandSubtitle")}
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs">
              Trusted dealer platform for verified agricultural, commercial, industrial, and residential land plots with on-site GPS tag precision.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {t("quickLinks") || "Quick Links"}
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1.5">
                  <span className="text-blue-500">›</span> {t("exploreLands")}
                </Link>
              </li>
              <li>
                <button
                  onClick={handleScrollToEnquiry}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1.5 text-left"
                >
                  <span className="text-blue-500">›</span> {t("instantEnquiryBtn")}
                </button>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1.5">
                  <span className="text-blue-500">›</span> {t("adminPortal")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Property Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {t("propertyTypes") || "Plot Categories"}
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{t("agricultural")}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>{t("commercial")}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                <span>{t("residential")}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>{t("estate")}</span>
              </li>
            </ul>
          </div>

          {/* Direct Helpline & WhatsApp */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              {t("directHelpline") || "Direct Support"}
            </h4>
            <div className="space-y-2.5">
              <a
                href="tel:+918839041639"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-blue-500 transition shadow-sm"
              >
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+91-8839041639</span>
              </a>

              <div>
                <a
                  href="https://wa.me/918839041639?text=Hello%20Dealer%2C%20I%20have%20an%20enquiry%20regarding%20land%20plots."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-md shadow-emerald-600/20"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  <span>WhatsApp Helpline</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Company Watermark */}
        <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
            © {new Date().getFullYear()} {t("brandName")}. All rights reserved.
          </div>

          {/* RadorA Company Logo Watermark & Contact Info */}
          <div className="flex flex-col items-center sm:items-end gap-2 group">
            <a
              href="https://www.radora.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/95 dark:bg-black/90 border border-slate-700/70 dark:border-slate-800 backdrop-blur-md shadow-md transition-all duration-300 hover:border-blue-500/60 hover:shadow-lg hover:scale-[1.02]"
              title="Visit RadorA - www.radora.tech"
            >
              <span className="text-[11px] font-semibold text-slate-300">
                Developed by
              </span>
              <img
                src="/radora-logo.png"
                alt="RadorA - Building What's Next"
                className="h-6 sm:h-7 w-auto object-contain shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://res.cloudinary.com/dae4jpydb/image/upload/v1787301477754/radora_logo.png";
                }}
              />
            </a>

            {/* Official Website & Email */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <a
                href="https://www.radora.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>www.radora.tech</span>
              </a>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <a
                href="mailto:office@radora.tech"
                className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                <svg className="w-3.5 h-3.5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>office@radora.tech</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
