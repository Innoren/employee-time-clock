export type GeoPoint = { latitude: number; longitude: number };

export type Worksite = {
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

export function metersBetween(a: GeoPoint, b: GeoPoint) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthMeters = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthMeters * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function mapsUrl(latitude: number, longitude: number) {
  return `https://maps.google.com/?q=${latitude},${longitude}`;
}

export function formatCoords(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export function formatDistance(meters: number) {
  const feet = meters * 3.28084;
  if (feet < 528) return `${Math.max(1, Math.round(feet))} ft`;
  const miles = meters / 1609.344;
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
}

export function worksiteFromBusiness(business: {
  siteName: string | null;
  siteLatitude: number | null;
  siteLongitude: number | null;
  siteRadiusMeters: number | null;
} | null): Worksite | null {
  if (
    !business ||
    business.siteLatitude == null ||
    business.siteLongitude == null
  ) {
    return null;
  }
  return {
    name: business.siteName?.trim() || "Worksite",
    latitude: business.siteLatitude,
    longitude: business.siteLongitude,
    radiusMeters: business.siteRadiusMeters || 152,
  };
}

export function distanceFromWorksite(point: GeoPoint, site: Worksite) {
  return metersBetween(point, site);
}

export function isOutsideWorksite(meters: number, site: Worksite) {
  return meters > site.radiusMeters;
}
