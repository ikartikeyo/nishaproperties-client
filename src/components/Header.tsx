import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useTheme } from "../contexts/ThemeContext";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, setTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const handleScrollToEnquiry = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
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

  const isAdmin = user && user.role?.toUpperCase() === "ADMIN";

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 sm:gap-3.5 group min-w-0"
          >
            <img
              src="https://res.cloudinary.com/dae4jpydb/image/upload/v1786888878/IMG_5090-removebg-preview_t7lceq.png"
              alt="Nisha Properties Logo"
              className="h-9 w-9 sm:h-12 sm:w-12 object-contain group-hover:scale-105 transition-transform shrink-0 drop-shadow-sm"
            />
            <div className="min-w-0">
              <span className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight block truncate">
                {t("brandName")}
              </span>
              <span className="text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase block -mt-0.5 truncate">
                {t("brandSubtitle")}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3">
            <Link
              to="/"
              className={`px-3.5 py-2.5 rounded-xl text-sm font-bold transition ${
                location.pathname === "/" || location.pathname === "/properties"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E293B]"
              }`}
            >
              {t("exploreLands")}
            </Link>

            {/* Sell Land Navigation Button */}
            <Link
              to="/sell"
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 border ${
                location.pathname === "/sell"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                  : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80 shadow-sm active:scale-95"
              }`}
              title="Sell Your Land / जमीन बेचें"
            >
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>{t("sellLand")}</span>
              <span className="hidden xl:inline-block px-1.5 py-0.5 text-[9px] font-black uppercase rounded-md bg-emerald-200 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100 tracking-wider">
                {t("sellLandNavBadge") || "Free"}
              </span>
            </Link>

            {/* Direct Phone Helpline */}
            <a
              href="tel:+918839041639"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition shadow-sm"
              title="Call Helpline: +91-8839041639"
            >
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>+91-8839041639</span>
            </a>

            {/* Instant Enquiry Scroll Button */}
            <button
              onClick={handleScrollToEnquiry}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center gap-2"
              title="Instant Enquiry / त्वरित पूछताछ"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{t("instantEnquiryBtn")}</span>
            </button>

            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3.5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-1.5 ${
                  location.pathname === "/admin"
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E293B]"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                {t("adminPanel")}
              </Link>
            )}

            {/* Compact Icon-Only Theme Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  theme === "light"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
                title="Light Mode"
                aria-label="Light Mode"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  theme === "dark"
                    ? "bg-[#0F172A] text-blue-400 shadow-sm border border-slate-700/60"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
                title="Dark Mode"
                aria-label="Dark Mode"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
            </div>

            {/* Language Switcher Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 transition flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Switch Language"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t("languageToggle")}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-700">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition"
                >
                  {t("logout")}
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="ml-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition"
              >
                {t("adminLogin")}
              </Link>
            )}
          </nav>

          {/* Mobile Actions & Hamburger Button */}
          <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
            {/* High-Priority Mobile Sell Land Button - Direct 1-Tap Access */}
            <Link
              to="/sell"
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md active:scale-95 border ${
                location.pathname === "/sell"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/30"
                  : "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white border-emerald-400/50 shadow-emerald-500/25"
              }`}
              title="Sell Land / जमीन बेचें"
            >
              <svg className="w-3.5 h-3.5 shrink-0 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-extrabold tracking-tight">
                {language === "hi" ? "जमीन बेचें" : "Sell Land"}
              </span>
              <span className="hidden min-[380px]:inline-block px-1 py-0.2 text-[9px] font-black uppercase rounded bg-white/25 text-white">
                FREE
              </span>
            </Link>

            {/* Quick Mobile Call Hotline */}
            <a
              href="tel:+918839041639"
              className="p-2 rounded-xl text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 transition"
              title="Call: +91-8839041639"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>

            {/* Quick Mobile Theme Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition"
              title="Toggle Theme"
            >
              {theme === "light" ? (
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Quick Mobile Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="px-2 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 transition"
              title="Toggle Language"
            >
              {language === "en" ? "हिन्दी" : "EN"}
            </button>

            {/* Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 transition"
              aria-label="Open Navigation Menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 px-2 border-t border-slate-200 dark:border-slate-800 space-y-3 animate-fadeIn">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition ${
                location.pathname === "/" || location.pathname === "/properties"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B]"
              }`}
            >
              {t("exploreLands")}
            </Link>

            {/* Mobile Sell Land Button */}
            <Link
              to="/sell"
              onClick={() => setMobileMenuOpen(false)}
              className={`w-full py-3 px-4 rounded-xl text-sm font-extrabold transition flex items-center justify-between border ${
                location.pathname === "/sell"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>{t("sellLandTitle") || t("sellLand")}</span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-md bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                {t("sellLandNavBadge") || "Free"}
              </span>
            </Link>

            <button
              onClick={handleScrollToEnquiry}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{t("instantEnquiryBtn")}</span>
            </button>

            <a
              href="tel:+918839041639"
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Call: +91-8839041639</span>
            </a>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition ${
                  location.pathname === "/admin"
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E293B]"
                }`}
              >
                {t("adminPanel")}
              </Link>
            )}

            {user ? (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-2">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-medium">{user.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition"
                >
                  {t("logout")}
                </button>
              </div>
            ) : (
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition"
              >
                {t("adminLogin")}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Mobile Sticky Bottom Floating Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-4 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] flex items-center justify-around">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-extrabold transition ${
            location.pathname === "/" || location.pathname === "/properties"
              ? "text-blue-600 dark:text-blue-400 font-black"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>{language === "hi" ? "जमीन देखें" : "Explore"}</span>
        </Link>

        {/* Featured Center Raised Sell Land Button */}
        <Link
          to="/sell"
          className="flex flex-col items-center -mt-5 group"
        >
          <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 border-2 border-white dark:border-[#0F172A] transform group-active:scale-95 transition-all">
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-300"></span>
            </span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight">
            {language === "hi" ? "🌾 जमीन बेचें" : "🌾 Sell Land"}
          </span>
        </Link>

        {/* Call Helpline */}
        <a
          href="tel:+918839041639"
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-extrabold text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition"
        >
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>{language === "hi" ? "कॉल करें" : "Call"}</span>
        </a>

        {/* WhatsApp Helpline */}
        <a
          href="https://wa.me/918839041639?text=Hello%20Nisha%20Properties,%20I%20want%20to%20sell%20or%20buy%20land%20in%20MP."
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-extrabold text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition"
        >
          <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
          </svg>
          <span>WhatsApp</span>
        </a>
      </div>
    </header>
  );
};

export default Header;