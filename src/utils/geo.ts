export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source?: "DEVICE_GPS" | "IMAGE_EXIF" | "MANUAL" | "VERIFIED";
  city?: string;
  state?: string;
  postalCode?: string;
  address?: string;
  formattedAddress?: string;
}

/**
 * Requests browser Geolocation permission and captures high-precision GPS coordinates
 */
export const getCurrentGPSCoordinates = (): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by your browser"));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: parseFloat(position.coords.latitude.toFixed(6)),
          longitude: parseFloat(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
        });
      },
      (error) => {
        let msg = "Failed to retrieve GPS location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow location access in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "GPS location information is unavailable. Check your device location settings.";
        } else if (error.code === error.TIMEOUT) {
          msg = "GPS location request timed out. Please try again.";
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Reverse geocodes coordinates to street address, city, and state using OpenStreetMap
 */
export const reverseGeocodeCoordinates = async (
  latitude: number,
  longitude: number
): Promise<{
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
}> => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
        },
      }
    );

    if (!res.ok) throw new Error("Reverse geocoding request failed");
    const data = await res.json();
    const addr = data.address || {};

    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.suburb ||
      addr.county ||
      "";
    const state = addr.state || "";
    const postalCode = addr.postcode || "";
    const country = addr.country || "India";
    const street = [addr.road, addr.suburb || addr.neighbourhood].filter(Boolean).join(", ");

    return {
      address: street || data.display_name?.split(",")[0] || "",
      city,
      state,
      postalCode,
      country,
      formattedAddress: data.display_name || `${street}, ${city}, ${state}`,
    };
  } catch (err) {
    console.warn("Reverse geocode fallback:", err);
    return {
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      formattedAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    };
  }
};

/**
 * Constructs Google Maps direct pin link for consumers
 */
export const getGoogleMapsUrl = (lat?: number, lon?: number): string => {
  if (lat === undefined || lon === undefined) return "#";
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
};

/**
 * Returns either manual location URL or GPS Google Maps link
 */
export const getEffectiveLocationUrl = (property?: {
  locationUrl?: string;
  latitude?: number;
  longitude?: number;
}): string => {
  if (property?.locationUrl && property.locationUrl.trim().startsWith("http")) {
    return property.locationUrl.trim();
  }
  if (property?.latitude !== undefined && property?.longitude !== undefined) {
    return getGoogleMapsUrl(property.latitude, property.longitude);
  }
  return "";
};

/**
 * Smartly attempts to parse latitude and longitude from a pasted Google Maps URL or text string
 */
export const extractCoordinatesFromUrl = (
  url: string
): { latitude: number; longitude: number } | null => {
  if (!url) return null;

  // 1. Match search/lat,+lon (e.g. google.com/maps/search/23.250221,+77.477635)
  const searchMatch = url.match(/\/search\/(-?\d+\.\d+)[,+](?:%20|\+)?(-?\d+\.\d+)/);
  if (searchMatch) {
    return {
      latitude: parseFloat(searchMatch[1]),
      longitude: parseFloat(searchMatch[2]),
    };
  }

  // 2. Match !3dlat!4dlon (Google Maps share / embed URLs)
  const dMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dMatch) {
    return {
      latitude: parseFloat(dMatch[1]),
      longitude: parseFloat(dMatch[2]),
    };
  }

  // 3. Match @lat,lon (e.g. google.com/maps/@12.9716,77.5946,15z)
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return {
      latitude: parseFloat(atMatch[1]),
      longitude: parseFloat(atMatch[2]),
    };
  }

  // 4. Match q=lat,lon or query=lat,lon or ll=lat,lon
  const qMatch = url.match(/[?&](?:q|query|ll)=(-?\d+\.\d+)[,+](?:%20|\+)?(-?\d+\.\d+)/);
  if (qMatch) {
    return {
      latitude: parseFloat(qMatch[1]),
      longitude: parseFloat(qMatch[2]),
    };
  }

  // 5. Match direct decimal lat, lon numbers in text (e.g. "23.250221, 77.477635")
  const numMatch = url.match(/(-?\d+\.\d{3,})[,+\s]+(-?\d+\.\d{3,})/);
  if (numMatch) {
    return {
      latitude: parseFloat(numMatch[1]),
      longitude: parseFloat(numMatch[2]),
    };
  }

  return null;
};

/**
 * Resolves any Google Maps link (including short maps.app.goo.gl links)
 * to exact GPS coordinates, street address, city, and state.
 */
export const resolveLocationUrlDetails = async (
  rawUrl: string
): Promise<{
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formattedAddress: string;
}> => {
  if (!rawUrl || !rawUrl.trim()) {
    throw new Error("Please provide a valid map link or URL.");
  }

  const url = rawUrl.trim();

  // 1. Try local extraction first if URL directly has coordinates
  const localCoords = extractCoordinatesFromUrl(url);
  if (localCoords && !url.includes("goo.gl")) {
    const geoData = await reverseGeocodeCoordinates(localCoords.latitude, localCoords.longitude);
    return {
      latitude: localCoords.latitude,
      longitude: localCoords.longitude,
      ...geoData,
    };
  }

  // 2. Call backend resolver for short links and redirects (maps.app.goo.gl, etc.)
  try {
    const res = await fetch(`/api/property/resolve-maps-url?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (res.ok && data.success && data.data?.latitude && data.data?.longitude) {
      return {
        latitude: data.data.latitude,
        longitude: data.data.longitude,
        address: data.data.address || "",
        city: data.data.city || "",
        state: data.data.state || "",
        postalCode: data.data.postalCode || "",
        country: data.data.country || "India",
        formattedAddress: data.data.formattedAddress || "",
      };
    }
  } catch (err) {
    console.warn("Backend map resolver warning:", err);
  }

  // 3. Final fallback with local coordinates if any
  if (localCoords) {
    const geoData = await reverseGeocodeCoordinates(localCoords.latitude, localCoords.longitude);
    return {
      latitude: localCoords.latitude,
      longitude: localCoords.longitude,
      ...geoData,
    };
  }

  throw new Error("Could not extract location details from this Google Maps link. Please verify the URL.");
};

/**
 * Constructs Google Maps driving directions link from user's current location to the land plot
 */
export const getGoogleDirectionsUrl = (lat?: number, lon?: number, locationUrl?: string): string => {
  if (locationUrl && locationUrl.trim().startsWith("http")) {
    return locationUrl.trim();
  }
  if (lat === undefined || lon === undefined) return "#";
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
};

/**
 * OpenStreetMap embed URL for rendering free interactive map in iframe
 */
export const getOpenStreetMapEmbedUrl = (lat: number, lon: number): string => {
  const delta = 0.005;
  const bbox = `${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
};

export interface CitySuggestion {
  city: string;
  state?: string;
  country?: string;
  displayName: string;
}

/**
 * Searches and auto-detects similar cities from geocoder (OpenStreetMap / Google Geo compatible)
 */
export const searchCitySuggestions = async (
  query: string,
  localCatalogCities: string[] = []
): Promise<CitySuggestion[]> => {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cleanQuery = query.trim().toLowerCase();
  const results: CitySuggestion[] = [];
  const seen = new Set<string>();

  // 1. Instant local matching against existing catalog cities
  for (const city of localCatalogCities) {
    if (city && city.toLowerCase().includes(cleanQuery)) {
      const key = city.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          city,
          displayName: city,
        });
      }
    }
  }

  // 2. Fetch live city/place suggestions from geocoding API
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      query.trim()
    )}&countrycodes=in&addressdetails=1&limit=12`;

    const res = await fetch(url, {
      headers: {
        "Accept-Language": "en",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const item of data) {
          const addr = item.address || {};
          const cityName =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.municipality ||
            addr.suburb ||
            addr.district ||
            addr.state_district ||
            item.name ||
            "";

          const stateName = addr.state || "";
          const country = addr.country || "India";

          if (cityName) {
            const key = `${cityName.toLowerCase()}_${stateName.toLowerCase()}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                city: cityName,
                state: stateName,
                country,
                displayName: stateName ? `${cityName}, ${stateName}` : cityName,
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Geocoding city suggestion error:", err);
  }

  return results.slice(0, 12);
};
