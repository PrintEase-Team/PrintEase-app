import * as Location from 'expo-location';

export interface LocationSearchResult {
  name: string;
  district: string;
  latitude: number;
  longitude: number;
}

export interface DeviceLocationResult {
  latitude: number;
  longitude: number;
  addressName: string;
}

/**
 * Calculates the Haversine distance between two sets of (latitude, longitude) coordinates in kilometers.
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
};

/**
 * Calculates the estimated walking time in minutes based on distance in kilometers.
 * Standard walking speed is ~5 km/h, which is 12 minutes per kilometer.
 */
export const calculateWalkTime = (distanceInKm: number): number => {
  if (distanceInKm <= 0) return 0;
  return Math.ceil(distanceInKm * 12);
};

/**
 * Queries the Photon Geocoding API for real Ghana location suggestions.
 */
export const searchGhanaLocations = async (query: string): Promise<LocationSearchResult[]> => {
  if (!query || query.trim().length < 2) return [];

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const response = await fetch(`https://photon.komoot.io/api/?q=${encodedQuery}&countrycode=gh&limit=6`);
    
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!data.features || !Array.isArray(data.features)) return [];

    return data.features.map((feature: any) => {
      const props = feature.properties || {};
      const coords = feature.geometry?.coordinates || [0, 0];
      
      const name = props.name || props.street || props.city || props.housenumber || query;
      const district = props.district || props.city || props.county || props.state || 'Ghana';
      
      return {
        name,
        district,
        longitude: coords[0],
        latitude: coords[1],
      };
    });
  } catch (error) {
    console.error('Error fetching Ghana location suggestions:', error);
    return [];
  }
};

/**
 * Requests device GPS location permissions and returns current coordinates & reverse-geocoded place name.
 */
export const getCurrentDeviceLocation = async (): Promise<DeviceLocationResult | null> => {
  try {
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      console.warn('Location services are disabled on the device.');
      return null;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Location permission was denied');
      return null;
    }

    let location = await Location.getLastKnownPositionAsync({});
    if (!location) {
      location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    }

    const { latitude, longitude } = location.coords;
    let addressName = 'Your Location';

    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        addressName = place.district || place.subregion || place.name || place.city || 'Your Location';
      }
    } catch (e) {
      console.warn('Reverse geocoding failed, fallback to default name:', e);
    }

    return {
      latitude,
      longitude,
      addressName,
    };
  } catch (error) {
    console.warn('Error getting device location:', error);
    return null;
  }
};
