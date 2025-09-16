// lib/google-maps.js
// Google Maps API integration utilities

// Sandwich bar location - NOON Sandwicherie & Koffie
export const SANDWICH_BAR_LOCATION = {
  lat: 51.0491, // Keizer Leopoldstraat 1, Gent coordinates
  lng: 3.7238,
  address: "Keizer Leopoldstraat 1, 9000 Gent, België"
};

// Delivery pricing structure
export const DELIVERY_PRICING = {
  RANGES: [
    { maxKm: 3, cost: 19, label: "0-3km" },      // 0-3km: €8
    { maxKm: 5, cost: 25, label: "3-5km" },     // 3-5km: €12
    { maxKm: Infinity, cost: 35, label: "5km+" } // 5km+: €25
  ],
  FREE_DELIVERY_THRESHOLD: 200 // Free delivery for orders above €100
};

// Load Google Maps API
let googleMapsPromise = null;

export const loadGoogleMaps = () => {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_JAVASCRIPT_API_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps API failed to load'));
      }
    };

    script.onerror = () => {
      reject(new Error('Google Maps API script failed to load'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

// Calculate distance between two points using Google Maps geometry
export const calculateDistance = (point1, point2) => {
  return new Promise((resolve, reject) => {
    loadGoogleMaps()
      .then((maps) => {
        try {
          const location1 = new maps.LatLng(point1.lat, point1.lng);
          const location2 = new maps.LatLng(point2.lat, point2.lng);

          // Calculate distance in meters
          const distanceInMeters = maps.geometry.spherical.computeDistanceBetween(location1, location2);
          const distanceInKm = distanceInMeters / 1000;

          resolve(distanceInKm);
        } catch (error) {
          reject(error);
        }
      })
      .catch(reject);
  });
};

// Get delivery cost based on distance
export const getDeliveryCost = (distanceKm, orderTotal = 0) => {
  // Free delivery for orders above threshold
  if (orderTotal >= DELIVERY_PRICING.FREE_DELIVERY_THRESHOLD) {
    return 0;
  }

  // Find appropriate pricing range
  const range = DELIVERY_PRICING.RANGES.find(r => distanceKm <= r.maxKm);
  return range ? range.cost : DELIVERY_PRICING.RANGES[DELIVERY_PRICING.RANGES.length - 1].cost;
};

// Validate if address is within delivery area (Belgium, postal code 9000, or within 10km)
export const validateAddressInDeliveryArea = (addressComponents, coordinates = null) => {
  const country = addressComponents.find(component =>
    component.types.includes('country')
  );

  const postalCode = addressComponents.find(component =>
    component.types.includes('postal_code')
  );

  const city = addressComponents.find(component =>
    component.types.includes('locality') ||
    component.types.includes('administrative_area_level_2')
  );

  // Check if in Belgium
  const isInBelgium = country && (
    country.short_name === 'BE' ||
    country.long_name.toLowerCase().includes('belgium') ||
    country.long_name.toLowerCase().includes('belgië')
  );

  if (!isInBelgium) {
    return {
      isValid: false,
      city: city?.long_name || '',
      country: country?.long_name || '',
      postalCode: postalCode?.long_name || '',
      reason: 'We only deliver within Belgium'
    };
  }

  // Check if postal code is 9000 (Gent)
  const isGentPostalCode = postalCode && postalCode.long_name === '9000';

  if (isGentPostalCode) {
    return {
      isValid: true,
      city: city?.long_name || '',
      country: country?.long_name || '',
      postalCode: postalCode?.long_name || '',
      reason: ''
    };
  }

  // If not postal code 9000, check if within 10km radius (if coordinates provided)
  if (coordinates) {
    try {
      const distance = calculateDistanceSync(SANDWICH_BAR_LOCATION, coordinates);
      const isWithinRadius = distance <= 10; // 10km radius

      return {
        isValid: isWithinRadius,
        city: city?.long_name || '',
        country: country?.long_name || '',
        postalCode: postalCode?.long_name || '',
        distance: Math.round(distance * 100) / 100,
        reason: isWithinRadius
          ? ''
          : `Address is ${distance.toFixed(1)}km away. We only deliver within 10km of Gent (postal code 9000)`
      };
    } catch (error) {
      console.error('Distance calculation error:', error);
      // Fallback to postal code validation only
      return {
        isValid: false,
        city: city?.long_name || '',
        country: country?.long_name || '',
        postalCode: postalCode?.long_name || '',
        reason: 'We primarily deliver to postal code 9000 (Gent)'
      };
    }
  }

  // No coordinates provided and not postal code 9000
  return {
    isValid: false,
    city: city?.long_name || '',
    country: country?.long_name || '',
    postalCode: postalCode?.long_name || '',
    reason: 'We primarily deliver to postal code 9000 (Gent). For other areas, please ensure you are within 10km of Gent.'
  };
};

// Synchronous distance calculation helper
const calculateDistanceSync = (point1, point2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
  const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * (Math.PI / 180)) * Math.cos(point2.lat * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Geocode an address and get coordinates
export const geocodeAddress = (address) => {
  return new Promise((resolve, reject) => {
    loadGoogleMaps()
      .then((maps) => {
        const geocoder = new maps.Geocoder();

        geocoder.geocode(
          {
            address: address,
            region: 'BE', // Bias results to Belgium
            componentRestrictions: {
              country: 'BE'
            }
          },
          (results, status) => {
            if (status === 'OK' && results[0]) {
              const result = results[0];
              const location = result.geometry.location;

              resolve({
                lat: location.lat(),
                lng: location.lng(),
                formattedAddress: result.formatted_address,
                addressComponents: result.address_components,
                placeId: result.place_id
              });
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      })
      .catch(reject);
  });
};

// Complete address validation and pricing calculation
export const validateAddressAndCalculateDelivery = async (address, orderTotal = 0) => {
  try {
    // 1. Geocode the address
    const geocodeResult = await geocodeAddress(address);

    // 2. Validate it's in delivery area (Belgium, postal code 9000, or within 10km)
    const validation = validateAddressInDeliveryArea(
      geocodeResult.addressComponents,
      { lat: geocodeResult.lat, lng: geocodeResult.lng }
    );

    if (!validation.isValid) {
      return {
        isValid: false,
        error: validation.reason,
        city: validation.city,
        country: validation.country
      };
    }

    // 3. Calculate distance from sandwich bar
    const distance = await calculateDistance(
      SANDWICH_BAR_LOCATION,
      { lat: geocodeResult.lat, lng: geocodeResult.lng }
    );

    // 4. Calculate delivery cost
    const deliveryCost = getDeliveryCost(distance, orderTotal);

    return {
      isValid: true,
      coordinates: {
        lat: geocodeResult.lat,
        lng: geocodeResult.lng
      },
      formattedAddress: geocodeResult.formattedAddress,
      distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
      deliveryCost,
      isFreeDelivery: deliveryCost === 0,
      city: validation.city,
      country: validation.country
    };

  } catch (error) {
    return {
      isValid: false,
      error: `Address validation failed: ${error.message}`
    };
  }
};