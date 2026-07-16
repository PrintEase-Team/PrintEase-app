import React, { useEffect, useState, useRef } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useRouter, useLocalSearchParams } from 'expo-router';
import api, { API_BASE } from '../services/api';
import { useOrderStore } from '../store/useOrderStore';
import {
  searchGhanaLocations,
  getCurrentDeviceLocation,
  calculateDistance,
  LocationSearchResult
} from '../services/locationService';
import { useAuthStore } from '../store/useAuthStore';

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

  if (!shopData?.operating_hours || shopData.operating_hours === '{}') return 'Open Now';
  try {
    const hours = JSON.parse(shopData.operating_hours);
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
      return `Open Now ΓÇó Closes ${formattedClose}`;
    } else {
      return `Closed ΓÇó Opens ${formattedOpen}`;
    }
  } catch (e) {
    return 'Open Now';
  }
};

const MOCK_LOCATIONS = [
  { name: 'Ayeduase Gate', district: 'Ayeduase', target: { x: -60, y: -20, scale: 1.45 } },
  { name: 'Ayeduase Park', district: 'Ayeduase', target: { x: -75, y: -40, scale: 1.5 } },
  { name: 'KNUST Commercial Area', district: 'Commercial', target: { x: 25, y: 30, scale: 1.4 } },
  { name: 'Brunei Complex', district: 'Brunei', target: { x: 55, y: -30, scale: 1.45 } },
  { name: 'Unity Hall Campus', district: 'Unity', target: { x: -20, y: 55, scale: 1.4 } },
  { name: 'Main Campus / PMB', district: 'Campus', target: { x: 0, y: 0, scale: 1.35 } },
  { name: 'Kotei Location', district: 'Kotei', target: { x: 65, y: 40, scale: 1.45 } },
];

export default function AllShopsScreen() {
  const router = useRouter();
  const { search } = useLocalSearchParams<{ search?: string }>();
  const { setSelectedShopId } = useOrderStore();
  
  const [shops, setShops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(search || '');
  const [showSuggestions, setShowSuggestions] = useState(!!search);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Real Geocoding & GPS State
  const [liveSuggestions, setLiveSuggestions] = useState<LocationSearchResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Animated Map Values
  const mapScale = useRef(new Animated.Value(1)).current;
  const mapTranslateX = useRef(new Animated.Value(0)).current;
  const mapTranslateY = useRef(new Animated.Value(0)).current;
  const userPulse = useRef(new Animated.Value(1)).current;
  const userPulseOpacity = useRef(new Animated.Value(0.6)).current;
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
          latitude: 6.6732 + (l.target.x * 0.0001),
          longitude: -1.5670 + (l.target.y * 0.0001),
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

  const { defaultLocationName, defaultLatitude, defaultLongitude } = useAuthStore();

  const handleUseMyLocation = async () => {
    setSelectedPinIndex(null);
    setIsSearchingLocation(true);
    let deviceLoc = await getCurrentDeviceLocation();
    
    if (!deviceLoc && defaultLocationName && defaultLatitude && defaultLongitude) {
      // Fallback to default location from profile if GPS is off/denied
      deviceLoc = {
        latitude: defaultLatitude,
        longitude: defaultLongitude,
        addressName: defaultLocationName,
      };
    }
    
    setIsSearchingLocation(false);

    if (deviceLoc) {
      setUserCoords({ latitude: deviceLoc.latitude, longitude: deviceLoc.longitude });
      setSelectedLocation(deviceLoc.addressName);
      setSearchQuery(deviceLoc.addressName);
      setShowSuggestions(false);
    } else {
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
    setSelectedPinIndex(null);
    setSelectedLocation(null);
    setUserCoords(null);
    setSearchQuery('');
    setShowSuggestions(false);
    Animated.parallel([
      Animated.timing(mapScale, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(mapTranslateX, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(mapTranslateY, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const handleFocusShopOnMap = (index: number) => {
    setSelectedPinIndex(index);
    const positions = [
      { x: 70, y: 25 },
      { x: 25, y: -35 },
      { x: -45, y: 15 },
      { x: 10, y: 55 }
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

    const latOffset = (loc.latitude - 6.6732) * 4000;
    const lngOffset = (loc.longitude - (-1.5670)) * 4000;
    const clampedX = Math.max(-90, Math.min(90, lngOffset));
    const clampedY = Math.max(-90, Math.min(90, -latOffset));

    Animated.parallel([
      Animated.timing(mapScale, { toValue: 1.5, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(mapTranslateX, { toValue: clampedX, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(mapTranslateY, { toValue: clampedY, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
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
    } catch (err) {
      console.error("Failed to fetch shops:", err);
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
    router.push('/shop-details' as any);
  };

  // Map shops with calculated distance
  const processedShops = shops.map((shop, index) => {
    const shopLat = shop.latitude || (6.6732 + (index * 0.003 - 0.004));
    const shopLng = shop.longitude || (-1.5670 + (index * 0.002 - 0.003));

    const distanceVal = userCoords
      ? calculateDistance(userCoords.latitude, userCoords.longitude, shopLat, shopLng)
      : (index * 0.4 + 0.3);

    return {
      ...shop,
      calculatedDistance: distanceVal,
      formattedDistance: `${distanceVal.toFixed(1)} km`,
    };
  });

  const filteredShops = processedShops.filter(shop => {
    if (selectedLocation || userCoords) {
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
                      <Text style={styles.suggestionSub}>Real Location ΓÇó {loc.district}</Text>
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
            style={[styles.filterChip, { backgroundColor: '#EFF6FF', borderColor: '#005CE6', borderWidth: 1.5, flex: 1.25 }]} 
            activeOpacity={0.7} 
            onPress={handleUseMyLocation}
          >
            <Feather name="navigation" size={14} color="#005CE6" />
            <Text style={[styles.filterChipText, { color: '#005CE6' }]} numberOfLines={1}>Use my location</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, selectedPinIndex === null && !searchQuery ? styles.filterChipActive : null, { flex: 1 }]} 
            onPress={handleResetMap}
          >
            <MaterialIcons name="storefront" size={15} color={selectedPinIndex === null && !searchQuery ? "#005CE6" : "#4B5563"} />
            <Text style={[styles.filterChipText, selectedPinIndex === null && !searchQuery ? styles.filterChipTextActive : null]} numberOfLines={1}>All Shops</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, { flex: 0.95, marginRight: 0 }]} 
            activeOpacity={0.7}
          >
            <View style={styles.greenDot} />
            <Text style={styles.filterChipText} numberOfLines={1}>Open Now</Text>
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
            {/* Base Parks & River */}
            <View style={styles.mockPark} />
            <View style={[styles.mockPark, { top: '60%', left: '70%', width: 220, height: 180, backgroundColor: '#DCFCE7' }]} />
            <View style={[styles.mockStreet, { top: '50%', left: '-10%', width: '120%', height: 16, backgroundColor: '#BAE6FD', transform: [{ rotate: '12deg' }] }]} />

            {/* Primary Avenues & Highways */}
            <View style={[styles.mockStreet, { top: '35%', height: 12, width: '150%', transform: [{rotate: '-15deg'}] }]} />
            <View style={[styles.mockStreet, { left: '42%', width: 12, height: '150%', transform: [{rotate: '25deg'}] }]} />
            <View style={[styles.mockStreet, { left: '68%', width: 14, height: '150%', transform: [{rotate: '-5deg'}] }]} />

            {/* Faded Detail Layer (Reveals finer streets & buildings when zoomed in) */}
            <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: detailOpacity }]}>
              {/* Secondary Streets & Alleys */}
              <View style={[styles.mockStreet, { top: '20%', height: 4, width: '100%', backgroundColor: '#FFFFFF', opacity: 0.8, transform: [{rotate: '10deg'}] }]} />
              <View style={[styles.mockStreet, { top: '55%', height: 4, width: '100%', backgroundColor: '#FFFFFF', opacity: 0.8, transform: [{rotate: '-30deg'}] }]} />
              <View style={[styles.mockStreet, { left: '25%', width: 4, height: '100%', backgroundColor: '#FFFFFF', opacity: 0.8, transform: [{rotate: '-10deg'}] }]} />
              <View style={[styles.mockStreet, { left: '55%', width: 4, height: '100%', backgroundColor: '#FFFFFF', opacity: 0.8, transform: [{rotate: '15deg'}] }]} />

              {/* Building Blocks / Department Structures */}
              <View style={{ position: 'absolute', top: '28%', left: '28%', width: 40, height: 30, backgroundColor: '#CBD5E1', borderRadius: 4 }} />
              <View style={{ position: 'absolute', top: '40%', left: '18%', width: 50, height: 35, backgroundColor: '#CBD5E1', borderRadius: 4 }} />
              <View style={{ position: 'absolute', top: '60%', left: '38%', width: 45, height: 40, backgroundColor: '#CBD5E1', borderRadius: 4 }} />
              <View style={{ position: 'absolute', top: '32%', left: '55%', width: 35, height: 45, backgroundColor: '#CBD5E1', borderRadius: 4 }} />
              <View style={{ position: 'absolute', top: '48%', left: '72%', width: 60, height: 30, backgroundColor: '#CBD5E1', borderRadius: 4 }} />

              <Text style={[styles.mockMapLabel1, { top: '26%', left: '30%', fontSize: 8, color: '#64748B' }]}>Library Block B</Text>
              <Text style={[styles.mockMapLabel1, { top: '62%', left: '40%', fontSize: 8, color: '#64748B' }]}>Engineering Annex</Text>
            </Animated.View>
            
            <Text style={styles.mockMapLabel1}>KNUST{'\n'}Commercial Area</Text>
            <Text style={styles.mockMapLabel2}>Baba Yara{'\n'}Sports Stadium</Text>
            <Text style={styles.mockMapLabel3}>University{'\n'}Main Campus</Text>

            {/* Dynamic Shop Markers */}
            {filteredShops.slice(0, 4).map((shop, idx) => {
              const markerCoords = [
                { top: '35%', left: '20%' },
                { top: '65%', left: '30%' },
                { top: '40%', left: '45%' },
                { top: '55%', left: '75%' }
              ][idx % 4];

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
          {filteredShops.length} shops found {selectedLocation ? <>near <Text style={{fontFamily: 'Poppins-Medium', color: '#005CE6'}}>"{selectedLocation}"</Text></> : searchQuery ? <>near <Text style={{fontFamily: 'Poppins-Medium', color: '#005CE6'}}>"{searchQuery}"</Text></> : ''}
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
                
                const waitTimes = [
                  { time: '4 min', color: '#005CE6', bg: '#EFF6FF' },
                  { time: '6 min', color: '#005CE6', bg: '#EFF6FF' },
                  { time: '8 min', color: '#005CE6', bg: '#EFF6FF' },
                  { time: '9 min', color: '#005CE6', bg: '#EFF6FF' }
                ];
                const wait = waitTimes[index % waitTimes.length];

                return (
                  <TouchableOpacity
                    key={shop.shop_id}
                    activeOpacity={0.8}
                    onPress={() => {
                      handleFocusShopOnMap(index);
                      handleShopPress(shop.shop_id);
                    }}
                    style={[
                      styles.shopCard,
                      selectedPinIndex === index && { borderColor: '#005CE6', borderWidth: 1.5 }
                    ]}
                  >
                    <View style={[styles.shopCardTop, { marginBottom: 10 }]}>
                      <View style={styles.shopImageContainer}>
                        <Image
                          source={shop.profile_picture_url ? { uri: `${API_BASE}${shop.profile_picture_url}` } : require('@/assets/images/logo-img.png')}
                          style={shop.profile_picture_url ? { width: '100%', height: '100%' } : { width: 36, height: 36 }}
                          resizeMode={shop.profile_picture_url ? "cover" : "contain"}
                        />
                      </View>
                      
                      <View style={[styles.shopInfo, { marginRight: 0 }]}>
                        <View style={styles.shopNameRow}>
                          <Text style={styles.shopName} numberOfLines={1}>{shop.shop_name}</Text>
                        </View>
                        
                        <View style={styles.shopStatusRow}>
                          <Text style={isOpenNow ? styles.openText : styles.closedText}>
                            {statusText.split(' ΓÇó ')[0]}
                          </Text>
                          {statusText.includes(' ΓÇó ') && (
                            <Text style={styles.statusTimeText}> ΓÇó {statusText.split(' ΓÇó ')[1]}</Text>
                          )}
                        </View>

                        <View style={styles.shopStatsRow}>
                          <MaterialIcons name="star" size={12} color="#F59E0B" />
                          <Text style={styles.ratingText}>
                            {shop.average_rating ? Number(shop.average_rating).toFixed(1) : 'New'}
                            {shop.total_ratings > 0 ? ` (${shop.total_ratings})` : ''}
                          </Text>
                          <Text style={styles.bulletText}> ΓÇó </Text>
                          <Feather name="navigation" size={11} color="#005CE6" />
                          <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 11, color: '#005CE6', marginLeft: 3 }}>
                            {shop.formattedDistance}
                          </Text>
                          <Text style={styles.bulletText}> ΓÇó </Text>
                          <MaterialIcons name="access-time" size={12} color="#9CA3AF" />
                          <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: '#6B7280', marginLeft: 4 }}>~{wait.time}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={[styles.shopCardBottom, { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 }]}>
                      <View style={{ flex: 1 }}>
                        <View style={[styles.locationRow, { alignItems: 'flex-start' }]}>
                          <Feather name="map-pin" size={12} color="#6B7280" style={{ marginTop: 2 }} />
                          <View style={{ flex: 1, marginLeft: 6 }}>
                            <Text style={[styles.locationText, { marginLeft: 0, fontSize: 12, color: '#4B5563' }]} numberOfLines={1}>
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
  mockStreet: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  mockPark: {
    position: 'absolute',
    top: -20,
    left: 20,
    width: 150,
    height: 120,
    backgroundColor: '#D1FAE5',
    borderRadius: 60,
    opacity: 0.7,
  },
  mockMapLabel1: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: '#4B5563',
    textAlign: 'center',
  },
  mockMapLabel2: {
    position: 'absolute',
    top: 20,
    left: 40,
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: '#10B981',
    textAlign: 'center',
  },
  mockMapLabel3: {
    position: 'absolute',
    top: 40,
    right: 20,
    fontFamily: 'Poppins-Medium',
    fontSize: 10,
    color: '#4B5563',
    textAlign: 'center',
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
    borderColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  shopCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  shopImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  shopInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
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
