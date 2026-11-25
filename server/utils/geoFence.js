/**
 * Calculates great-circle distance in meters between two GPS coordinates using Haversine formula
 */
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Validates whether user coordinates fall within the building's allowed geo-fence radius
 */
const verifyGeoFence = ({ userLat, userLng, targetLat, targetLng, radiusMeters = 150 }) => {
  if (targetLat === null || targetLat === undefined || targetLng === null || targetLng === undefined) {
    return { allowed: true, distanceMeters: 0, radiusMeters };
  }

  if (userLat === undefined || userLat === null || userLng === undefined || userLng === null) {
    return {
      allowed: false,
      distanceMeters: null,
      radiusMeters,
      reason: 'Location permission is required to verify physical presence at the campus facility.',
    };
  }

  const distanceMeters = calculateDistanceMeters(
    Number(userLat),
    Number(userLng),
    Number(targetLat),
    Number(targetLng)
  );

  const allowed = distanceMeters <= Number(radiusMeters);

  return {
    allowed,
    distanceMeters,
    radiusMeters: Number(radiusMeters),
    reason: allowed
      ? 'Within campus facility boundary'
      : `Geo-fence check failed: You are ${distanceMeters}m away from the building (must be within ${radiusMeters}m).`,
  };
};

module.exports = { calculateDistanceMeters, verifyGeoFence };