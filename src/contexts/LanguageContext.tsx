import React, { createContext, useContext, useState } from "react";

export type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Header
    brandName: "Nisha Properties",
    brandSubtitle: "Land & Properties",
    exploreLands: "Explore Lands",
    adminPanel: "Admin Panel",
    adminLogin: "Admin Login",
    logout: "Logout",
    languageToggle: "हिंदी",
    themeLight: "Light",
    themeDark: "Dark",

    // Home Page Hero
    heroBadge: "Verified Land Plots & Commercial Acreage",
    heroTitlePrefix: "Discover & Acquire ",
    heroTitleHighlight: "Prime Land",
    heroSubtitle: "Browse verified agricultural, commercial, industrial, and luxury residential plots with full title verification and transparent pricing.",
    searchPlaceholder: "Search city, state, or title...",
    
    // Property Types
    allTypes: "All Property Types",
    agricultural: "Agricultural Land",
    commercial: "Commercial Plot",
    residential: "Residential Plot",
    industrial: "Industrial Plot",
    estate: "Estate / Acreage",

    // Sort Options
    sortNewest: "Sort: Newly Listed",
    sortPriceLow: "Price: Low to High",
    sortPriceHigh: "Price: High to Low",
    sortArea: "Area: Largest First",

    // Listings Section
    featuredListings: "Featured Listings",
    showingProperties: "Showing available properties",
    resetFilters: "Reset Filters",
    loadingProperties: "Loading properties...",
    noPropertiesFound: "No Land Listings Available Yet",
    emptyStateDesc: "The catalog is currently clear and ready for new plots. Landlords and admins can add listings from the console.",
    addFirstPlotAdmin: "+ Add First Land Plot (Admin)",

    // Property Card & Details
    gpsTagged: "GPS Tagged",
    locationVerified: "Location Verified",
    featuredBadge: "Featured",
    contactForPrice: "Contact for Price",
    inr: "INR",
    currencySymbol: "₹",
    totalArea: "Total Area",
    status: "Status",
    viewExactLocationMaps: "View Exact Location on Google Maps",
    viewDetailsEnquiry: "View Details & Enquiry",
    home: "Home",
    properties: "Properties",
    backToAllProperties: "Back to All Properties",
    propertyDetails: "Property Specifications",
    overviewLandDescription: "Overview & Land Description",
    noDescription: "No detailed description provided for this land listing.",
    verifiedOnSiteGps: "Verified On-Site GPS",
    locationLinkAvailable: "Location Link Available",
    landLocationNavigation: "Land Location & Navigation",
    landLocationPin: "Land Location Pin",
    copyGps: "Copy GPS",
    copied: "Copied!",
    drivingDirections: "Driving Directions",
    openInGoogleMaps: "Open in Google Maps",
    offeredPrice: "Offered Price",
    uponRequest: "Upon Request",
    verifiedTitleDeed: "Verified Clear Title Deed",
    directLandlordSupport: "Direct Landlord / Dealer Support",
    gpsCoordinatesChecked: "GPS Coordinates Checked On-Site",
    chatOnWhatsApp: "Chat on WhatsApp with Dealer",
    sendEnquiry: "Send Property Enquiry",
    enquirySentSuccess: "Enquiry Sent Successfully!",
    enquiryRefNumber: "Reference Number",

    // Enquiry Modal / Form
    enquiryFormTitle: "Send Enquiry for Land Plot",
    enquiryFormSubtitle: "Direct dealer response via phone, WhatsApp, and email alert.",
    fullName: "Full Name",
    fullNamePlaceholder: "e.g. Rahul Sharma",
    mobileNumber: "Mobile Number (WhatsApp)",
    mobilePlaceholder: "e.g. 9876543210",
    emailAddress: "Email Address",
    emailPlaceholder: "e.g. rahul@example.com",
    cityPlace: "Your City / Place",
    placePlaceholder: "e.g. Bhopal, MP",
    messageOptional: "Message or Questions (Optional)",
    submittingEnquiry: "Submitting Enquiry...",
    submitEnquiryBtn: "Submit Enquiry Now",
    instantWhatsAppContact: "Instant WhatsApp Follow-up:",
    closeModal: "Close",
    generalEnquiryTitle: "Looking for Something Specific or Have Other Questions?",
    generalEnquirySubtitle: "Fill out this quick enquiry form with your requirements and our land dealer team will contact you directly.",
    sendGeneralEnquiryBtn: "Submit General Enquiry",
    instantEnquiryBtn: "Instant Enquiry",
    directHelpline: "Direct Helpline:",

    // Admin Login
    adminPortal: "Admin Portal",
    adminPortalSubtitle: "Sign in to manage land listings and customer enquiries",
    adminEmail: "Admin Email",
    password: "Password",
    signInBtn: "Sign In to Admin Panel",
    authenticating: "Authenticating...",
    fillDefaultAdmin: "Fill Default Admin (admin@example.com)",
    returnToPublicSite: "Return to public website",

    // Admin Panel Header & Stats
    adminConsoleBadge: "Landlord & Admin Console",
    loggedInAs: "Logged in as:",
    plotCraftOperations: "Nisha Properties Real Estate Operations",
    addNewPlotBtn: "Add New Plot",
    publicSiteLink: "Public Site",
    totalPlots: "Total Land Plots",
    activeCatalogListings: "Active Catalog Listings",
    customerInquiries: "Customer Inquiries",
    leadsReceived: "Buyer Leads Received",
    featuredPlots: "Featured Plots",
    highlightedOnHomepage: "Highlighted on Homepage",
    gpsVerifiedPlots: "GPS Verified",
    directMapsEnabled: "Direct Maps Enabled",

    // Admin Tabs & Bulk Toolbar
    tabPlotsManagement: "Plots Management",
    tabCustomerInquiries: "Customer Inquiries",
    tabAddPlot: "+ Add Plot with GPS & Camera",
    tabEditPlot: "Edit Plot",
    manageLandListings: "Manage Land Listings",
    plotsSelected: "plot(s) selected",
    inquiriesSelected: "inquiry(ies) selected",
    deleteSelected: "Delete Selected",
    deselectAll: "Deselect All",
    noPlotsInTable: "No properties found. Click '+ Add Plot with GPS & Camera' to publish one!",
    noInquiriesInTable: "No customer enquiries received yet.",

    // Plots Table Columns & Actions
    colPlot: "Plot / Property",
    colType: "Type",
    colPrice: "Price",
    colArea: "Area",
    colLocationGps: "Location & GPS",
    colFeatured: "Featured",
    colActions: "Actions",
    btnEdit: "Edit",
    btnView: "View",
    btnDelete: "Delete",
    btnStandard: "Standard",
    noLocationLink: "No Location Link",

    // Inquiries Table Columns
    colRef: "Ref & Plot",
    colBuyerName: "Buyer Name",
    colContact: "Phone",
    colEmail: "Email",
    colPlace: "Place",
    colStatus: "Status",
    btnWhatsAppChat: "WhatsApp",
    btnMarkContacted: "Contacted",

    // Add / Edit Plot Form
    editingModeBadge: "EDITING MODE",
    editPlotTitlePrefix: "Edit Land Plot:",
    publishNewPlotTitle: "Publish New Land Plot with Live GPS Tag",
    editPlotSubtitle: "Update pricing, specifications, photos, or GPS location tags below.",
    publishPlotSubtitle: "Upload photos from camera/file and auto-fetch high-precision GPS satellite coordinates.",
    cancelEditingBtn: "Cancel Editing",
    cancel: "Cancel",
    saveChangesBtn: "Save Changes & Update Plot",
    publishPlotBtn: "Publish Land Listing with GPS Tag",
    savingChanges: "Saving Changes...",
    publishingPlot: "Publishing Land Plot...",

    // Photo & GPS Section
    photoGpsAutoCapture: "Photo & GPS Auto-Capture",
    photoGpsDesc: "Click photos on-site with camera. Coordinates will autofill for instant buyer navigation.",
    btnOpenCamera: "Open Camera (Live Auto-GPS)",
    btnUploadFiles: "Upload from Files",
    btnDetectGps: "Detect Live GPS",
    detectingGps: "Detecting GPS...",
    uploadingPhotos: "Uploading...",
    uploadedPhotosCount: "Uploaded Photos",
    liveGpsLocked: "Live GPS Coordinates Locked",
    manualLocationAttached: "Manual Location Link Attached",
    removeAutoLocation: "Remove Auto Location",
    verifyOnGoogleMaps: "Verify on Google Maps",

    // Form Inputs
    propertyTitle: "Property Title *",
    propertyTitlePlaceholder: "e.g. Royal Meadows Corner Commercial Plot",
    propertyTypeLabel: "Property Type *",
    priceLabel: "Price (₹ INR) *",
    pricePlaceholder: "e.g. 2500000",
    areaUnitLabel: "Select Area Unit *",
    areaValueLabel: "Area Value / Quantity *",
    areaPlaceholder: "e.g. 2.5 or 5000",
    streetAddress: "Street Address (Autofilled by GPS)",
    cityLabel: "City",
    cityPlaceholder: "e.g. Bangalore",
    stateLabel: "State",
    statePlaceholder: "e.g. Karnataka",
    gpsCoordinatesHeader: "GPS Coordinates & Location Link",
    gpsLatitude: "GPS Latitude",
    gpsLongitude: "GPS Longitude",
    autoDetectionActive: "Auto-Detection Active",
    inactiveLocked: "Inactive",
    autoDetectedOnPhotoSnap: "Auto-detected on photo snap",
    gpsLockHint: "GPS coordinates will activate automatically when you snap a photo with camera or click 'Detect Live GPS'.",
    manualLocationLink: "Manual Location Link / Google Maps URL (Optional)",
    manualLocationPlaceholder: "e.g. https://maps.app.goo.gl/xyz or https://www.google.com/maps?q=12.9716,77.5946",
    manualLocationHint: "Paste any Google Maps link. If coordinates are found in the link, GPS fields will be autofilled.",
    detailedDescription: "Detailed Description",
    descriptionPlaceholder: "Describe zoning, road connectivity, soil quality, water/electricity access, nearby landmarks, etc.",
    markAsFeaturedPlot: "Mark as Featured Plot (Highlight on Homepage)",

    // Live Camera Modal
    liveCameraFeed: "Live Camera Feed",
    flipCamera: "Flip Camera",
    closeCamera: "Close Camera",
    autoGpsReadyOnSnap: "Auto-GPS Ready on Snap",
    takePhotoShutter: "Take Photo & Lock GPS",
    filePickerFallback: "File Picker",
  },
  hi: {
    // Brand & Header
    brandName: "निशा प्रॉपर्टीज",
    brandSubtitle: "भूमि एवं संपत्ति",
    exploreLands: "जमीनें देखें",
    adminPanel: "व्यवस्थापक पैनल",
    adminLogin: "एडमिन लॉगिन",
    logout: "लॉग आउट",
    languageToggle: "English",
    themeLight: "लाइट",
    themeDark: "डार्क",

    // Home Page Hero
    heroBadge: "सत्यापित भूमि भूखंड एवं व्यावसायिक जमीनें",
    heroTitlePrefix: "खोजें और खरीदें अपनी पसंद की ",
    heroTitleHighlight: "सर्वोत्तम जमीन",
    heroSubtitle: "स्पष्ट स्वामित्व सत्यापन और पारदर्शी कीमतों के साथ सत्यापित कृषि, व्यावसायिक, औद्योगिक और आवासीय भूखंड देखें।",
    searchPlaceholder: "शहर, राज्य या प्लॉट का नाम खोजें...",

    // Property Types
    allTypes: "सभी प्रकार की जमीन",
    agricultural: "कृषि भूमि (खेती)",
    commercial: "व्यावसायिक भूखंड (कॉमर्शियल)",
    residential: "आवासीय भूखंड (रेजिडेंशियल)",
    industrial: "औद्योगिक भूखंड (इंडस्ट्रियल)",
    estate: "फार्महाउस / एस्टेट",

    // Sort Options
    sortNewest: "क्रमबद्ध: नवीनतम पहले",
    sortPriceLow: "कीमत: कम से ज्यादा",
    sortPriceHigh: "कीमत: ज्यादा से कम",
    sortArea: "क्षेत्रफल: सबसे बड़ा पहले",

    // Listings Section
    featuredListings: "प्रमुख भूखंड सूची",
    showingProperties: "उपलब्ध भूखंड दिख रहे हैं",
    resetFilters: "फ़िल्टर हटाएं",
    loadingProperties: "भूखंड लोड हो रहे हैं...",
    noPropertiesFound: "वर्तमान में कोई भूखंड उपलब्ध नहीं है",
    emptyStateDesc: "कैटलॉग अभी खाली है। मालिक और व्यवस्थापक नए भूखंड जोड़ सकते हैं।",
    addFirstPlotAdmin: "+ पहला भूखंड जोड़ें (व्यवस्थापक)",

    // Property Card & Details
    gpsTagged: "जीपीएस टैग युक्त",
    locationVerified: "सत्यापित स्थान",
    featuredBadge: "प्रमुख",
    contactForPrice: "कीमत के लिए संपर्क करें",
    inr: "INR",
    currencySymbol: "₹",
    totalArea: "कुल क्षेत्रफल",
    status: "स्थिति",
    viewExactLocationMaps: "गूगल मैप्स पर सटीक स्थान देखें",
    viewDetailsEnquiry: "विवरण और पूछताछ देखें",
    home: "मुख्य पृष्ठ",
    properties: "भूखंड",
    backToAllProperties: "सभी भूखंडों पर वापस जाएं",
    propertyDetails: "भूखंड विनिर्देश",
    overviewLandDescription: "अवलोकन एवं भूमि विवरण",
    noDescription: "इस भूखंड के लिए कोई विस्तृत विवरण नहीं दिया गया है।",
    verifiedOnSiteGps: "सत्यापित ऑन-साइट जीपीएस",
    locationLinkAvailable: "लोकेशन लिंक उपलब्ध है",
    landLocationNavigation: "भूमि स्थान एवं दिशा-निर्देश",
    landLocationPin: "भूमि स्थान पिन",
    copyGps: "जीपीएस कॉपी करें",
    copied: "कॉपी हो गया!",
    drivingDirections: "ड्राइविंग दिशा-निर्देश",
    openInGoogleMaps: "गूगल मैप्स में खोलें",
    offeredPrice: "प्रस्तावित मूल्य",
    uponRequest: "अनुरोध पर",
    verifiedTitleDeed: "सत्यापित स्पष्ट स्वामित्व दस्तावेज",
    directLandlordSupport: "डीलर / मालिक से सीधा संपर्क",
    gpsCoordinatesChecked: "ऑन-साइट सत्यापित जीपीएस निर्देशांक",
    chatOnWhatsApp: "डीलर से व्हाट्सएप पर चैट करें",
    sendEnquiry: "भूखंड के लिए पूछताछ भेजें",
    enquirySentSuccess: "पूछताछ सफलतापूर्वक भेज दी गई!",
    enquiryRefNumber: "संदर्भ संख्या (रेफरेंस नंबर)",

    // Enquiry Modal / Form
    enquiryFormTitle: "भूखंड के लिए पूछताछ भेजें",
    enquiryFormSubtitle: "फोन, व्हाट्सएप और ईमेल अलर्ट के माध्यम से डीलर द्वारा तुरंत प्रतिक्रिया।",
    fullName: "पूरा नाम",
    fullNamePlaceholder: "उदा. राहुल शर्मा",
    mobileNumber: "मोबाइल नंबर (व्हाट्सएप)",
    mobilePlaceholder: "उदा. 9876543210",
    emailAddress: "ईमेल पता",
    emailPlaceholder: "उदा. rahul@example.com",
    cityPlace: "आपका शहर / स्थान",
    placePlaceholder: "उदा. भोपाल, मध्य प्रदेश",
    messageOptional: "संदेश या प्रश्न (वैकल्पिक)",
    submittingEnquiry: "पूछताछ भेजी जा रही है...",
    submitEnquiryBtn: "अभी पूछताछ जमा करें",
    instantWhatsAppContact: "व्हाट्सएप पर तुरंत संपर्क करें:",
    closeModal: "बंद करें",
    generalEnquiryTitle: "क्या आप किसी विशेष भूमि की तलाश में हैं या कोई अन्य प्रश्न है?",
    generalEnquirySubtitle: "अपनी आवश्यकताओं के साथ यह त्वरित पूछताछ फ़ॉर्म भरें और हमारी टीम आपसे सीधे संपर्क करेगी।",
    sendGeneralEnquiryBtn: "सामान्य पूछताछ जमा करें",
    instantEnquiryBtn: "त्वरित पूछताछ",
    directHelpline: "सीधी हेल्पलाइन:",

    // Admin Login
    adminPortal: "व्यवस्थापक पोर्टल (एडमिन)",
    adminPortalSubtitle: "भूखंड सूची और ग्राहक पूछताछ प्रबंधित करने के लिए लॉगिन करें",
    adminEmail: "एडमिन ईमेल",
    password: "पासवर्ड",
    signInBtn: "एडमिन पैनल में लॉगिन करें",
    authenticating: "प्रमाणीकरण हो रहा है...",
    fillDefaultAdmin: "डिफ़ॉल्ट एडमिन भरें (admin@example.com)",
    returnToPublicSite: "मुख्य वेबसाइट पर वापस जाएं",

    // Admin Panel Header & Stats
    adminConsoleBadge: "भूस्वामी एवं व्यवस्थापक कंसोल",
    loggedInAs: "लॉगिन उपयोगकर्ता:",
    plotCraftOperations: "निशा प्रॉपर्टीज रियल एस्टेट ऑपरेशंस",
    addNewPlotBtn: "नया भूखंड जोड़ें",
    publicSiteLink: "पब्लिक वेबसाइट",
    totalPlots: "कुल भूखंड",
    activeCatalogListings: "सक्रिय लिस्टिंग",
    customerInquiries: "ग्राहक पूछताछ",
    leadsReceived: "प्राप्त लीड्स",
    featuredPlots: "प्रमुख भूखंड",
    highlightedOnHomepage: "होमपेज पर हाइलाइट किए गए",
    gpsVerifiedPlots: "जीपीएस सत्यापित",
    directMapsEnabled: "डायरेक्ट मैप्स सक्षम",

    // Admin Tabs & Bulk Toolbar
    tabPlotsManagement: "भूखंड प्रबंधन",
    tabCustomerInquiries: "ग्राहक पूछताछ",
    tabAddPlot: "+ जीपीएस और कैमरे से भूखंड जोड़ें",
    tabEditPlot: "भूखंड संपादित करें",
    manageLandListings: "भूमि लिस्टिंग प्रबंधित करें",
    plotsSelected: "भूखंड चुने गए",
    inquiriesSelected: "पूछताछ चुनी गई",
    deleteSelected: "चयनित हटाएं",
    deselectAll: "सभी चयन हटाएं",
    noPlotsInTable: "कोई भूखंड नहीं मिला। नया भूखंड जोड़ने के लिए '+ जीपीएस और कैमरे से भूखंड जोड़ें' पर क्लिक करें!",
    noInquiriesInTable: "अभी तक कोई ग्राहक पूछताछ प्राप्त नहीं हुई है।",

    // Plots Table Columns & Actions
    colPlot: "भूखंड / संपत्ति",
    colType: "प्रकार",
    colPrice: "कीमत",
    colArea: "क्षेत्रफल",
    colLocationGps: "स्थान एवं जीपीएस",
    colFeatured: "प्रमुख",
    colActions: "कार्य",
    btnEdit: "संपादित करें",
    btnView: "देखें",
    btnDelete: "हटाएं",
    btnStandard: "सामान्य",
    noLocationLink: "कोई लोकेशन लिंक नहीं",

    // Inquiries Table Columns
    colRef: "रेफरेंस एवं प्लॉट",
    colBuyerName: "खरीदार का नाम",
    colContact: "फोन नंबर",
    colEmail: "ईमेल",
    colPlace: "स्थान",
    colStatus: "स्थिति",
    btnWhatsAppChat: "व्हाट्सएप",
    btnMarkContacted: "संपर्क किया",

    // Add / Edit Plot Form
    editingModeBadge: "संपादन मोड",
    editPlotTitlePrefix: "भूखंड संपादित करें:",
    publishNewPlotTitle: "लाइव जीपीएस टैग के साथ नया भूखंड प्रकाशित करें",
    editPlotSubtitle: "मूल्य, विनिर्देश, फोटो या जीपीएस स्थान टैग अपडेट करें।",
    publishPlotSubtitle: "कैमरा/फ़ाइल से फ़ोटो अपलोड करें और उच्च-सटीक जीपीएस निर्देशांक प्राप्त करें।",
    cancelEditingBtn: "संपादन रद्द करें",
    cancel: "रद्द करें",
    saveChangesBtn: "परिवर्तन सहेजें और भूखंड अपडेट करें",
    publishPlotBtn: "जीपीएस टैग के साथ भूखंड प्रकाशित करें",
    savingChanges: "सहेजा जा रहा है...",
    publishingPlot: "प्रकाशित किया जा रहा है...",

    // Photo & GPS Section
    photoGpsAutoCapture: "फोटो एवं जीपीएस ऑटो-कैप्चर",
    photoGpsDesc: "ऑन-साइट कैमरे से फ़ोटो लें। खरीदार नेविगेशन के लिए निर्देशांक स्वतः भर जाएंगे।",
    btnOpenCamera: "कैमरा खोलें (लाइव ऑटो-जीपीएस)",
    btnUploadFiles: "फ़ाइलों से अपलोड करें",
    btnDetectGps: "लाइव जीपीएस पहचानें",
    detectingGps: "जीपीएस खोजा जा रहा है...",
    uploadingPhotos: "अपलोड हो रहा है...",
    uploadedPhotosCount: "अपलोड की गई तस्वीरें",
    liveGpsLocked: "लाइव जीपीएस निर्देशांक लॉक हो गए",
    manualLocationAttached: "मैन्युअल लोकेशन लिंक संलग्न है",
    removeAutoLocation: "ऑटो लोकेशन हटाएं",
    verifyOnGoogleMaps: "गूगल मैप्स पर सत्यापित करें",

    // Form Inputs
    propertyTitle: "भूखंड का शीर्षक / नाम *",
    propertyTitlePlaceholder: "उदा. रॉयल मीडोज कमर्शियल कॉर्नर प्लॉट",
    propertyTypeLabel: "जमीन का प्रकार *",
    priceLabel: "कीमत (₹ INR) *",
    pricePlaceholder: "उदा. 2500000",
    areaUnitLabel: "क्षेत्रफल इकाई चुनें *",
    areaValueLabel: "क्षेत्रफल मात्रा / मान *",
    areaPlaceholder: "उदा. 2.5 या 5000",
    streetAddress: "सड़क / पता (जीपीएस द्वारा स्वतः भरा गया)",
    cityLabel: "शहर",
    cityPlaceholder: "उदा. भोपाल",
    stateLabel: "राज्य",
    statePlaceholder: "उदा. मध्य प्रदेश",
    gpsCoordinatesHeader: "जीपीएस निर्देशांक एवं लोकेशन लिंक",
    gpsLatitude: "जीपीएस अक्षांश (Latitude)",
    gpsLongitude: "जीपीएस रेखांश (Longitude)",
    autoDetectionActive: "ऑटो-डिटेक्शन सक्रिय",
    inactiveLocked: "निष्क्रिय",
    autoDetectedOnPhotoSnap: "फोटो खींचने पर स्वतः पहचाना जाएगा",
    gpsLockHint: "जब आप कैमरे से फोटो खींचेंगे या 'लाइव जीपीएस पहचानें' पर क्लिक करेंगे, तो जीपीएस निर्देशांक स्वतः सक्रिय हो जाएंगे।",
    manualLocationLink: "मैन्युअल लोकेशन लिंक / गूगल मैप्स URL (वैकल्पिक)",
    manualLocationPlaceholder: "उदा. https://maps.app.goo.gl/xyz या https://www.google.com/maps?q=12.9716,77.5946",
    manualLocationHint: "कोई भी गूगल मैप्स लिंक पेस्ट करें। निर्देशांक मिलने पर जीपीएस फील्ड स्वतः भर जाएंगे।",
    detailedDescription: "विस्तृत विवरण",
    descriptionPlaceholder: "ज़ोनिंग, सड़क कनेक्टिविटी, मिट्टी की गुणवत्ता, पानी/बिजली पहुंच, नजदीकी स्थल आदि का विवरण दें।",
    markAsFeaturedPlot: "प्रमुख भूखंड के रूप में चिह्नित करें (होमपेज पर हाइलाइट)",

    // Live Camera Modal
    liveCameraFeed: "लाइव कैमरा फीड",
    flipCamera: "कैमरा बदलें",
    closeCamera: "कैमरा बंद करें",
    autoGpsReadyOnSnap: "फोटो खींचते ही जीपीएस तैयार",
    takePhotoShutter: "फोटो लें और जीपीएस लॉक करें",
    filePickerFallback: "फ़ाइल चुनें",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app_language");
    return saved === "hi" ? "hi" : "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === "en" ? "hi" : "en";
    setLanguage(nextLang);
  };

  const t = (key: string, fallback?: string): string => {
    const dict = translations[language] || translations.en;
    return dict[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

