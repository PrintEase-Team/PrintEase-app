import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLocalSearchParams, useRouter } from 'expo-router';
import api, { API_BASE } from '../services/api';
import {
  calculateDistance,
  calculateWalkTime,
  getCurrentDeviceLocation,
  LocationSearchResult,
  searchGhanaLocations
} from '../services/locationService';
import { useAuthStore } from '../store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';

const formatTime12h = (time24: string) => {
  if (!time24) return '';
  const [hourStr, minStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minStr} ${ampm}`;
};

const getShopStatus = (shopData: any) => {
  if (!shopData?.is_active) return 'Closed';

  if (shopData?.status_override === 'CLOSED' || shopData?.status_override === 'OPEN') {
    if (shopData?.override_expires_at) {
      const expiresStr = shopData.override_expires_at.endsWith('Z')
        ? shopData.override_expires_at
        : shopData.override_expires_at + 'Z';
      const expiresAt = new Date(expiresStr);
      if (new Date() < expiresAt) {
        return shopData.status_override === 'OPEN' ? 'Open Now' : 'Closed';
      }
    } else if (shopData?.status_override === 'CLOSED') {
      return 'Closed';
    }
  }

  let hoursString = shopData?.operating_hours;
  if (!hoursString || hoursString === '{}') {
    hoursString = '{"Monday":{"active":true,"open":"08:00","close":"17:00"},"Tuesday":{"active":true,"open":"08:00","close":"17:00"},"Wednesday":{"active":true,"open":"08:00","close":"17:00"},"Thursday":{"active":true,"open":"08:00","close":"17:00"},"Friday":{"active":true,"open":"08:00","close":"17:00"},"Saturday":{"active":false,"open":"09:00","close":"14:00"},"Sunday":{"active":false,"open":"10:00","close":"14:00"}}';
  }
  try {
    const hours = JSON.parse(hoursString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const todayHours = hours[today];

    if (!todayHours || !todayHours.active) return 'Closed Today';

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);

    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    const formattedOpen = formatTime12h(todayHours.open);
    const formattedClose = formatTime12h(todayHours.close);

    if (currentTime >= openTime && currentTime <= closeTime) {
      return `Open Now • Closes ${formattedClose}`;
    } else {
      return `Closed • Opens ${formattedOpen}`;
    }
  } catch (e) {
    return 'Open Now';
  }
};

const MOCK_LOCATIONS = [
  { name: 'Queens Hall', district: 'KNUST', target: { x: 60, y: 60, scale: 1.45 } },
  { name: 'Paa Joe Stadium', district: 'KNUST', target: { x: 0, y: 60, scale: 1.5 } },
  { name: 'KNUST Library Mall', district: 'KNUST', target: { x: -60, y: 60, scale: 1.4 } },
  { name: 'Prempeh II Library', district: 'KNUST', target: { x: 60, y: 10, scale: 1.45 } },
  { name: 'KNUST Great Hall', district: 'KNUST', target: { x: 60, y: -40, scale: 1.4 } },
  { name: 'Blader Skates Ghana', district: 'KNUST', target: { x: 10, y: 10, scale: 1.45 } },
  { name: 'CCB Auditorium', district: 'KNUST', target: { x: -50, y: 10, scale: 1.4 } },
  { name: 'School of Medical Sciences', district: 'KNUST', target: { x: 0, y: -60, scale: 1.45 } },
  { name: 'Faculty of Pharmacy', district: 'KNUST', target: { x: -60, y: -40, scale: 1.45 } },
];

export default function AllShopsScreen() {
  const router = useRouter();
  const { search, intent } = useLocalSearchParams<{ search?: string, intent?: string }>();
  const { setSelectedShopId } = useOrderStore();

  const [shops, setShops] = useState<any[]>([]);
  const [queueMap, setQueueMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {
    defaultLocationName,
    defaultLatitude,
    defaultLongitude,
    activeLocationName,
    activeLatitude,
    activeLongitude,
    isUsingLiveLocation,
    setLiveLocation,
    clearLiveLocation
  } = useAuthStore();

  const initialSearch = search || activeLocationName || defaultLocationName || '';
  const initialSelected = search ? null : (activeLocationName || defaultLocationName);
  const initialCoords = (activeLatitude && activeLongitude && !search) ? { latitude: activeLatitude, longitude: activeLongitude } : null;

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showSuggestions, setShowSuggestions] = useState(!!search);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(initialSelected);

  // Real Geocoding & GPS State
  const [liveSuggestions, setLiveSuggestions] = useState<LocationSearchResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(initialCoords);
  const [showOpenOnly, setShowOpenOnly] = useState(false);

  // Sync local coords when global active coords change (e.g. from homescreen)
  useEffect(() => {
    if (!search) {
      if (activeLatitude && activeLongitude) {
        setUserCoords({ latitude: activeLatitude, longitude: activeLongitude });
        setSelectedLocation(activeLocationName);
        setSearchQuery(activeLocationName || '');
      } else {
        setUserCoords(null);
      }
    }
  }, [activeLatitude, activeLongitude, activeLocationName, search]);

  // Animated Map Values
  const mapScale = useRef(new Animated.Value(1)).current;
  const mapTranslateX = useRef(new Animated.Value(0)).current;
  const mapTranslateY = useRef(new Animated.Value(0)).current;
  const userPulse = useRef(new Animated.Value(1)).current;
  const userPulseOpacity = useRef(new Animated.Value(0.7)).current;
  const [selectedPinIndex, setSelectedPinIndex] = useState<number | null>(null);

  const triggerPulseAnimation = () => {
    userPulse.setValue(1);
    userPulseOpacity.setValue(0.7);
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(userPulse, { toValue: 2.2, duration: 1200, useNativeDriver: true }),
          Animated.timing(userPulseOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(userPulse, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(userPulseOpacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ]),
      { iterations: 3 }
    ).start();
  };

  const detailOpacity = mapScale.interpolate({
    inputRange: [1, 1.25, 1.5],
    outputRange: [0.15, 0.65, 1],
  });

  // Fetch real Ghana locations on input change
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setIsSearchingLocation(true);
      const timer = setTimeout(async () => {
        const apiResults = await searchGhanaLocations(searchQuery);
        const campusMatches: LocationSearchResult[] = MOCK_LOCATIONS.filter(loc =>
          loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.district.toLowerCase().includes(searchQuery.toLowerCase())
        ).map(l => ({
          name: l.name,
          district: l.district,
          latitude: 6.6732 - (l.target.y * 0.0001),
          longitude: -1.5670 + (l.target.x * 0.0001),
        }));

        const combined = [...apiResults, ...campusMatches];
        const unique = combined.filter((item, index, self) =>
          index === self.findIndex((t) => t.name.toLowerCase() === item.name.toLowerCase())
        );

        setLiveSuggestions(unique.slice(0, 6));
        setIsSearchingLocation(false);
      }, 250);

      return () => clearTimeout(timer);
    } else {
      setLiveSuggestions([]);
      setIsSearchingLocation(false);
    }
  }, [searchQuery]);

  const revertToDefaultLocation = () => {
    setSelectedPinIndex(null);
    setShowSuggestions(false);
    clearLiveLocation();

    Animated.parallel([
      Animated.timing(mapScale, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(mapTranslateX, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(mapTranslateY, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const handleUseMyLocation = async () => {
    if (isUsingLiveLocation) {
      return revertToDefaultLocation();
    }

    setSelectedPinIndex(null);
    setIsSearchingLocation(true);
    let deviceLoc = await getCurrentDeviceLocation();

    setIsSearchingLocation(false);

    if (deviceLoc) {
      setLiveLocation(deviceLoc.addressName, deviceLoc.latitude, deviceLoc.longitude);
      setShowSuggestions(false);
    } else {
      // Fallback
      setSelectedLocation('My Location');
    }

    Animated.parallel([
      Animated.timing(mapScale, { toValue: 1.45, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(mapTranslateX, { toValue: -30, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(mapTranslateY, { toValue: -15, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    triggerPulseAnimation();
  };

  const handleResetMap = () => {
    if (selectedPinIndex === null && !searchQuery) {
      // Toggle off: revert to default location
      return revertToDefaultLocation();
    }

    setSelectedPinIndex(null);
    setSearchQuery('');
    setShowSuggestions(false);
    clearLiveLocation();

    // We intentionally DO NOT clear userCoords or selectedLocation here.
    // This ensures that the distance calculations don't randomly jump to the 
    // fallback mock distances. The user stays anchored to their last known location.

    Animated.parallel([
      Animated.timing(mapScale, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(mapTranslateX, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(mapTranslateY, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const handleFocusShopOnMap = (index: number) => {
    setSelectedPinIndex(index);
    const positions = [
      { x: 120, y: 80 },    // For top: '35%', left: '20%'
      { x: 80, y: -80 },    // For top: '65%', left: '30%'
      { x: 20, y: 50 },     // For top: '40%', left: '45%'
      { x: -100, y: -30 }   // For top: '55%', left: '75%'
    ];
    const target = positions[index % positions.length];
    Animated.parallel([
      Animated.timing(mapScale, { toValue: 1.5, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(mapTranslateX, { toValue: target.x, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(mapTranslateY, { toValue: target.y, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const handleSelectLocation = (loc: LocationSearchResult) => {
    setSearchQuery(loc.name);
    setSelectedLocation(loc.name);
    setUserCoords({ latitude: loc.latitude, longitude: loc.longitude });
    setShowSuggestions(false);
    setSelectedPinIndex(null);
    clearLiveLocation();

    const latOffset = (loc.latitude - 6.6732) * 10000;
    const lngOffset = (loc.longitude - (-1.5670)) * 10000;
    const clampedX = Math.max(-120, Math.min(120, lngOffset));
    const clampedY = Math.max(-120, Math.min(120, -latOffset));

    Animated.parallel([
      Animated.timing(mapScale, { toValue: 1.45, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(mapTranslateX, { toValue: clampedX, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(mapTranslateY, { toValue: clampedY, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };


  useEffect(() => {
    if (searchQuery.trim().length > 0 && !selectedLocation) {
      const targetScale = 1 + Math.min(searchQuery.length * 0.035, 0.4);
      const charCode = searchQuery.charCodeAt(0) || 0;
      const offsetX = (charCode % 5 - 2) * 20;
      const offsetY = (charCode % 3 - 1) * 20;

      Animated.parallel([
        Animated.timing(mapScale, { toValue: targetScale, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(mapTranslateX, { toValue: offsetX, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(mapTranslateY, { toValue: offsetY, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else if (selectedPinIndex === null && !selectedLocation) {
      Animated.parallel([
        Animated.timing(mapScale, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(mapTranslateX, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(mapTranslateY, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [searchQuery]);

  const fetchShops = async () => {
    try {
      const res = await api.get('/shops');
      setShops(res.data);

      const allOrdersRes = await api.get('/orders');
      if (allOrdersRes.data && Array.isArray(allOrdersRes.data)) {
        const qMap: Record<string, number> = {};
        allOrdersRes.data.forEach((o: any) => {
          if (o.status === 'Pending' || o.status === 'Printing') {
            const sid = o.shop_id || o.shop?.shop_id;
            if (sid) {
              qMap[sid] = (qMap[sid] || 0) + 1;
            }
          }
        });
        setQueueMap(qMap);
      }
    } catch (err) {
      console.error("Failed to fetch shops/orders:", err);
    }
  };

  useEffect(() => {
    fetchShops().finally(() => setIsLoading(false));
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchShops();
    setRefreshing(false);
  }, []);

  const handleBack = () => router.back();

  const handleShopPress = (shopId: string) => {
    setSelectedShopId(shopId);
    if (intent) {
      router.push({ pathname: '/shop-details', params: { intent } } as any);
    } else {
      router.push('/shop-details' as any);
    }
  };

  // Map shops with calculated distance
  const processedShops = shops.map((shop, index) => {
    // Generate deterministic pseudo-coordinates IF the database lacks real coordinates
    // so that mathematical distance can still be correctly computed.
    const shopLat = shop.latitude || (6.6732 + (index * 0.003 - 0.004));
    const shopLng = shop.longitude || (-1.5670 + (index * 0.002 - 0.003));

    // ALWAYS calculate correct distance mathematically! No mock fallbacks.
    const distanceVal = userCoords
      ? calculateDistance(userCoords.latitude, userCoords.longitude, shopLat, shopLng)
      : 0;

    const queueTime = ((queueMap[shop.shop_id] || 0) * 2) + 2;
    const walkTime = calculateWalkTime(distanceVal);

    return {
      ...shop,
      latitude: shopLat,
      longitude: shopLng,
      calculatedDistance: distanceVal,
      formattedDistance: userCoords ? `${distanceVal.toFixed(1)} km` : `-- km`,
      queueTime,
      walkTime,
    };
  });

  const filteredShops = processedShops.filter(shop => {
    if (showOpenOnly && getShopStatus(shop).includes('Closed')) {
      return false;
    }

    if (!searchQuery) return true;

    if (searchQuery === selectedLocation) {
      return true;
    }
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      shop.shop_name?.toLowerCase().includes(query) ||
      shop.location?.toLowerCase().includes(query) ||
      shop.additional_location_details?.toLowerCase().includes(query)
    );
  }).sort((a, b) => {
    if (userCoords || selectedLocation) {
      return a.calculatedDistance - b.calculatedDistance;
    }
    return 0;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find a Print Shop</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005CE6']} />}
      >
        {/* Search Bar */}
        <View style={{ zIndex: 10, position: 'relative' }}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#6B7280" />
            <TextInput
              placeholder="Search for a shop or location (e.g. Ayeduase)"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowSuggestions(true);
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setSearchQuery('');
                setShowSuggestions(false);
                clearLiveLocation();
                setSelectedLocation(null);
                setUserCoords(null);
                handleResetMap();
              }}>
                <Feather name="x-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Real Ghana Autocomplete Dropdown */}
          {showSuggestions && searchQuery.trim().length >= 2 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsHeader}>Real Ghana Locations & Campus Areas</Text>
              {isSearchingLocation ? (
                <View style={{ padding: 12, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#005CE6" />
                </View>
              ) : liveSuggestions.length > 0 ? (
                liveSuggestions.map((loc, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => handleSelectLocation(loc)}
                    style={styles.suggestionItem}
                  >
                    <View style={styles.suggestionIconBg}>
                      <Feather name="map-pin" size={14} color="#005CE6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionTitle}>{loc.name}</Text>
                      <Text style={styles.suggestionSub}>Real Location • {loc.district}</Text>
                    </View>
                    <Feather name="arrow-up-left" size={14} color="#9CA3AF" />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={{ fontSize: 12, color: '#9CA3AF', padding: 8 }}>No matching locations found in Ghana</Text>
              )}
            </View>
          )}
        </View>

        {/* Location & Filter Chips Bar */}
        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            style={[styles.filterChip, isUsingLiveLocation ? styles.filterChipActive : { backgroundColor: '#ffffff', borderColor: '#E5E7EB', borderWidth: 1 }, { flex: 1.25 }]}
            activeOpacity={0.7}
            onPress={handleUseMyLocation}
          >
            <Feather name="navigation" size={14} color={isUsingLiveLocation ? "#005CE6" : "#4B5563"} />
            <Text style={[styles.filterChipText, isUsingLiveLocation ? styles.filterChipTextActive : { color: '#4B5563' }]} numberOfLines={1}>Use my location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedPinIndex === null && !searchQuery && !isUsingLiveLocation ? styles.filterChipActive : { backgroundColor: '#ffffff', borderColor: '#E5E7EB', borderWidth: 1 }, { flex: 1 }]}
            onPress={handleResetMap}
          >
            <MaterialIcons name="storefront" size={15} color={selectedPinIndex === null && !searchQuery && !isUsingLiveLocation ? "#005CE6" : "#4B5563"} />
            <Text style={[styles.filterChipText, selectedPinIndex === null && !searchQuery && !isUsingLiveLocation ? styles.filterChipTextActive : { color: '#4B5563' }]} numberOfLines={1}>All Shops</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, showOpenOnly ? styles.filterChipActive : { backgroundColor: '#ffffff', borderColor: '#E5E7EB', borderWidth: 1 }, { flex: 0.95, marginRight: 0 }]}
            activeOpacity={0.7}
            onPress={() => setShowOpenOnly(!showOpenOnly)}
          >
            <View style={showOpenOnly ? [styles.greenDot, { backgroundColor: '#fff' }] : styles.greenDot} />
            <Text style={[styles.filterChipText, showOpenOnly ? styles.filterChipTextActive : { color: '#4B5563' }]} numberOfLines={1}>Open Now</Text>
          </TouchableOpacity>
        </View>

        {/* Animated Map View */}
        <View style={styles.mapContainer}>
          <Animated.View style={[
            styles.mockMapBg,
            {
              transform: [
                { scale: mapScale },
                { translateX: mapTranslateX },
                { translateY: mapTranslateY },
              ]
            }
          ]}>
            <Image 
              source={require('../assets/images/map-bg.png')}  
              style={{ width: '100%', height: '100%', position: 'absolute' }}
              resizeMode="cover"
            />

            {/* Dynamic Shop Markers */}
            {filteredShops.slice(0, 4).map((shop, idx) => {
              const markerCoords = [
                { top: '35%', left: '20%' },
                { top: '65%', left: '30%' },
                { top: '40%', left: '45%' },
                { top: '55%', left: '75%' }
              ][idx % 4] as any;

              const isSelected = selectedPinIndex === idx;

              return (
                <TouchableOpacity
                  key={shop.shop_id}
                  activeOpacity={0.8}
                  onPress={() => handleFocusShopOnMap(idx)}
                  style={[styles.mapMarkerAbsolute, markerCoords, { zIndex: isSelected ? 10 : 2 }]}
                >
                  <View style={[
                    styles.mapMarker,
                    isSelected && { backgroundColor: '#005CE6', transform: [{ scale: 1.25 }] }
                  ]}>
                    <MaterialIcons name="storefront" size={14} color="#fff" />
                  </View>
                  {isSelected && (
                    <View style={styles.markerBadge}>
                      <Text style={styles.markerBadgeText} numberOfLines={1}>{shop.shop_name}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* User Location Animated Marker */}
            <View style={[styles.mapMarkerAbsolute, { top: '45%', left: '60%' }]}>
              <Animated.View style={[
                styles.userLocationRadius,
                {
                  transform: [{ scale: userPulse }],
                  opacity: userPulseOpacity,
                }
              ]} />
              <View style={styles.userLocationMarker}>
                <View style={styles.userLocationDot} />
              </View>
            </View>
          </Animated.View>

          <TouchableOpacity
            style={styles.mapCenterBtn}
            activeOpacity={0.8}
            onPress={handleUseMyLocation}
          >
            <Feather name="crosshair" size={20} color="#005CE6" />
          </TouchableOpacity>
        </View>

        {/* Results Info */}
        <Text style={styles.resultsInfo}>
          {filteredShops.length} shops found {selectedLocation ? <>near <Text style={{ fontFamily: 'Poppins-Medium', color: '#005CE6' }}>"{selectedLocation}"</Text></> : searchQuery ? <>near <Text style={{ fontFamily: 'Poppins-Medium', color: '#005CE6' }}>"{searchQuery}"</Text></> : ''}
        </Text>

        {/* Shops list */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#005CE6" style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.shopsList}>
            {filteredShops.length > 0 ? (
              filteredShops.map((shop, index) => {
                const statusText = getShopStatus(shop);
                const isOpenNow = statusText.includes('Open Now');
                const walkTimeStr = shop.walkTime > 0 ? `${shop.walkTime} min` : '<1 min';

                return (
                  <TouchableOpacity
                    key={shop.shop_id}
                    activeOpacity={0.8}
                    onPress={() => {
                      handleFocusShopOnMap(index);
                      handleShopPress(shop.shop_id);
                    }}
                    style={styles.shopCard}
                  >
                    {/* Storefront Banner Image */}
                    <View style={styles.shopBannerContainer}>
                      {shop.banner_picture_url ? (
                        <Image
                          source={{ uri: `${API_BASE}${shop.banner_picture_url}` }}
                          style={styles.shopBannerImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.shopBannerImage, { backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' }]}>
                          <Feather name="image" size={24} color="#475569" />
                        </View>
                      )}
                    </View>

                    {/* Card Body with Overlapping Avatar */}
                    <View style={styles.shopCardBody}>
                      <View style={styles.shopAvatarContainer}>
                        <Image
                          source={
                            shop.profile_picture_url
                              ? { uri: `${API_BASE}${shop.profile_picture_url}` }
                              : require('../assets/images/logo-img.png')
                          }
                          style={styles.shopAvatarImage}
                          resizeMode={shop.profile_picture_url ? "cover" : "contain"}
                        />
                      </View>

                      <View style={styles.shopInfo}>
                        <View style={styles.shopNameRow}>
                          <Text style={styles.shopName} numberOfLines={1}>{shop.shop_name}</Text>
                          <MaterialIcons name="verified" size={16} color="#005CE6" style={{ marginLeft: 4 }} />
                        </View>

                        <View style={styles.shopStatusRow}>
                          <Text style={isOpenNow ? styles.openText : styles.closedText}>
                            {statusText.split(' • ')[0]}
                          </Text>
                          {statusText.includes(' • ') && (
                            <Text style={styles.statusTimeText}> • {statusText.split(' • ')[1]}</Text>
                          )}
                        </View>

                        <View style={styles.shopStatsRow}>
                          <MaterialIcons name="star" size={12} color="#F59E0B" />
                          <Text style={styles.ratingText}>
                            {shop.average_rating ? Number(shop.average_rating).toFixed(1) : '4.0'}
                            {shop.total_ratings > 0 ? ` (${shop.total_ratings})` : ' (2)'}
                          </Text>
                          <Text style={styles.bulletText}> • </Text>
                          <Feather name="navigation" size={11} color="#005CE6" />
                          <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 11, color: '#005CE6', marginLeft: 3 }}>
                            {shop.formattedDistance}
                          </Text>
                          <Text style={styles.bulletText}> • </Text>
                          <MaterialIcons name="access-time" size={12} color="#9CA3AF" />
                          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: '#6B7280', marginLeft: 4 }}>
                            {isOpenNow ? `~${shop.queueTime} min` : '-- min'}
                          </Text>
                          <Text style={styles.bulletText}> • </Text>
                          <MaterialIcons name="directions-walk" size={12} color="#9CA3AF" />
                          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: '#6B7280', marginLeft: 4 }}>
                            {walkTimeStr}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={[styles.shopCardBottom, { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, paddingHorizontal: 12, paddingBottom: 12 }]}>
                      <View style={{ flex: 1 }}>
                        <View style={[styles.locationRow, { alignItems: 'flex-start' }]}>
                          <Feather name="map-pin" size={12} color="#6B7280" style={{ marginTop: 2 }} />
                          <View style={{ flex: 1, marginLeft: 6 }}>
                            <Text style={[styles.locationText, { marginLeft: 0, fontSize: 12, color: '#4B5563', fontFamily: 'Poppins-Medium' }]} numberOfLines={1}>
                              {shop.location}
                            </Text>
                            {shop.additional_location_details && (
                              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>
                                {shop.additional_location_details}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 20 }}>No shops found.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FAFBFF',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  iconButton: {
    padding: 8,
    marginLeft: -8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#111827',
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    height: 42,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#005CE6',
    borderWidth: 1.5,
  },
  filterChipText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#111827',
    marginLeft: 4,
  },
  filterChipTextActive: {
    color: '#005CE6',
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  mapContainer: {
    marginHorizontal: 20,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#EAF1FC',
    marginBottom: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mockMapBg: {
    position: 'absolute',
    width: '260%',
    height: '260%',
    top: '-80%',
    left: '-80%',
    backgroundColor: '#EAEFE9',
  },
  mapMarkerAbsolute: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapMarker: {
    backgroundColor: '#111827',
    padding: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  markerBadge: {
    position: 'absolute',
    bottom: -22,
    backgroundColor: '#005CE6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  markerBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
  },
  userLocationRadius: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 92, 230, 0.1)',
  },
  userLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 92, 230, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#005CE6',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  mapCenterBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsInfo: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#6B7280',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  shopsList: {
    paddingHorizontal: 20,
  },
  shopCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  shopBannerContainer: {
    height: 115,
    width: '100%',
    backgroundColor: '#1F2937',
  },
  shopBannerImage: {
    width: '100%',
    height: '100%',
  },
  shopCardBody: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  shopAvatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    marginTop: -24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopAvatarImage: {
    width: '100%',
    height: '100%',
  },
  shopInfo: {
    flex: 1,
    marginLeft: 12,
    marginTop: 6,
  },
  shopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  shopName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#111827',
  },
  shopStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  openText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#10B981',
  },
  closedText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#EF4444',
  },
  statusTimeText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  shopStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: '#4B5563',
    marginLeft: 4,
  },
  bulletText: {
    fontSize: 12,
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  distanceText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  shopCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  locationText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: -8,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  suggestionsHeader: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  suggestionIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  suggestionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: '#111827',
  },
  suggestionSub: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: '#6B7280',
  },
});
