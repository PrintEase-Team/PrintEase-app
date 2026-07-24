import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import api, { API_BASE } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useOrderStore } from '../../store/useOrderStore';

const { width } = Dimensions.get('window');

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
      // Append 'Z' to treat backend LocalDateTime as UTC, preventing timezone drift
      const expiresStr = shopData.override_expires_at.endsWith('Z') 
        ? shopData.override_expires_at 
        : shopData.override_expires_at + 'Z';
        
      const expiresAt = new Date(expiresStr);
      if (new Date() < expiresAt) {
        return shopData.status_override === 'OPEN' ? 'Open' : 'Closed';
      }
    } else if (shopData?.status_override === 'CLOSED') {
      return 'Closed'; // Fallback if no expiration is set
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

    if (closeTime < openTime) {
      // Overnight shift (e.g. 06:00 to 03:00 next day)
      if (currentTime >= openTime || currentTime <= closeTime) {
        return `Open • Closes ${formattedClose}`;
      } else {
        return `Closed • Opens ${formattedOpen}`;
      }
    } else {
      // Normal shift
      if (currentTime >= openTime && currentTime <= closeTime) {
        return `Open • Closes ${formattedClose}`;
      } else {
        return `Closed • Opens ${formattedOpen}`;
      }
    }
  } catch (e) {
    return 'Open';
  }
};


// Removed SHopsData, now fetching from backend.

// Data for Popular Services
const PopularServicesData = [
  { id: '1', label: 'Document Printing', icon: 'description' },
  { id: '2', label: 'Photo Printing', icon: 'photo' },
  { id: '3', label: 'Scanning', icon: 'document-scanner' },
  { id: '4', label: 'Binding', icon: 'menu-book' },
  { id: '5', label: 'Lamination', icon: 'layers' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user_id } = useAuthStore();
  const { setSelectedShopId } = useOrderStore();
  const [activeOrder, setActiveOrder] = React.useState<any>(null);
  const [userName, setUserName] = React.useState<string>('Student');
  const [hasUnread, setHasUnread] = React.useState(false);
  const [shops, setShops] = React.useState<any[]>([]);
  const [defaultShopId, setDefaultShopId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  const shakeAnimation = React.useRef(new Animated.Value(0)).current;

  const fetchAllData = async () => {
    if (!user_id) return;
    try {
      const activeOrderRes = await api.get(`/orders/student/${user_id}`);
      const active = activeOrderRes.data.find((o: any) =>
        o.status === 'Pending' || o.status === 'Printing' || o.status === 'Ready'
      );
      if (active) {
        setActiveOrder({
          id: active.order_id?.substring(0, 8).toUpperCase(),
          rawId: active.order_id,
          shopName: active.shop_name || 'My Print Shop',
          status: active.status === 'Pending' ? 'Active' : active.status,
          pickupCode: active.pickup_code
        });
      } else {
        setActiveOrder(null);
      }

      const userRes = await api.get(`/users/${user_id}`);
      if (userRes.data) {
        const name = userRes.data.full_name || userRes.data.name;
        if (name) setUserName(name.split(' ')[0]);
        if (userRes.data.default_shop_id !== undefined) setDefaultShopId(userRes.data.default_shop_id);
      }

      const notifRes = await api.get(`/notifications/user/${user_id}`);
      const unread = notifRes.data.some((n: any) => !n.is_read);
      setHasUnread(unread);

      const shopsRes = await api.get('/shops');
      setShops(shopsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, [user_id]);

  useFocusEffect(
    React.useCallback(() => {
      fetchAllData();
    }, [user_id]));

  const handleShopPress = (shopId: string, shopName: string) => {
    setSelectedShopId(shopId);
    router.push('/shop-details' as any);
  };

  const handleNotificationPress = () => {
    router.push('/(tabs)/notifications' as any);
  };

  const handleConfirmPickup = (orderId: string) => {
    Alert.alert(
      'Confirm Pickup',
      'Did you pick up your order?',
      [
        { text: 'Not Yet', style: 'cancel' },
        { 
          text: 'Yes, I picked it up', 
          onPress: async () => {
            try {
              await api.put(`/orders/${orderId}`, { status: 'Collected' });
              setActiveOrder(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to update order status.');
            }
          }
        }
      ]
    );
  };

  const filteredShops = shops.filter(shop => 
    shop.shop_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    shop.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.additional_location_details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadPress = () => {
    if (defaultShopId) {
      setSelectedShopId(defaultShopId);
      router.push('/upload-file' as any);
    } else {
      Alert.alert(
        'No Shop Selected',
        'Please select a print shop first before uploading a file.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Browse Shops', onPress: () => router.push('/all-shops' as any) }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header / Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userName}</Text>
          <Text style={styles.subGreeting}>Where do you want to print today?</Text>
        </View>
        <TouchableOpacity
          onPress={handleNotificationPress}
          activeOpacity={0.7}
          style={styles.bellContainer}
        >
          <MaterialIcons name="notifications-none" size={28} color="#111827" />
          {hasUnread && <View style={styles.bellBadge} />}
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005CE6']} />}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder="Search for a print shop or location"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => {
              if (searchQuery.trim().length > 0 && filteredShops.length === 0) {
                router.push({ pathname: '/all-shops', params: { search: searchQuery } } as any);
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Feather name="x-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {activeOrder && (
          <TouchableOpacity 
            onPress={() => router.push({
              pathname: '/order-details',
              params: {
                orderId: activeOrder.id,
                shopName: activeOrder.shopName || 'Print Shop',
                shopLocation: 'Your Campus',
                documentName: activeOrder.documentName || 'Document',
                pagesInfo: activeOrder.pagesInfo || '',
                price: `GHS ${activeOrder.total_amount?.toFixed(2) || '0.00'}`,
                status: activeOrder.status,
                date: new Date().toLocaleDateString(),
                fileType: 'pdf',
                pickupCode: activeOrder.pickupCode,
                rawId: activeOrder.rawId,
              }
            } as any)} 
            activeOpacity={0.8}
            style={{ marginTop: 24, padding: 16, backgroundColor: '#F3F8FE', borderRadius: 16, borderWidth: 1, borderColor: '#EAF1FC' }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: '#111827' }}>Active Order</Text>
              <View style={{ backgroundColor: '#005CE6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Poppins-Bold' }}>{activeOrder.status}</Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: '#4B5563', marginBottom: 4 }}>
              Order ID: {activeOrder.id}
            </Text>
            {activeOrder.status === 'Ready' && (
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: '#10B981', marginTop: 8 }}>
                Pickup Code: {activeOrder.pickupCode}
              </Text>
            )}
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14, color: '#005CE6' }}>View order details &rarr;</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Default Print Shop Section */}
        {searchQuery.length === 0 && (!defaultShopId || !shops.find(s => s.shop_id === defaultShopId)) ? (
          <View style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#93C5FD',
            borderStyle: 'dashed',
            backgroundColor: '#FAFBFF',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#EFF6FF',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16
            }}>
              <MaterialIcons name="storefront" size={28} color="#005CE6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 14, color: '#111827', marginBottom: 4 }}>No default print shop set</Text>
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: '#4B5563', marginBottom: 12 }}>Set a default shop to make checkout faster and get a better experience.</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/all-shops' as any)}
                style={{ backgroundColor: '#005CE6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignSelf: 'flex-start' }}
              >
                <Text style={{ color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 12 }}>Choose a Default Shop</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (searchQuery.length === 0 && shops.find(s => s.shop_id === defaultShopId)) && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Default Print Shop</Text>
              <View style={styles.defaultBadge}>
                <MaterialIcons name="star" size={14} color="#005CE6" />
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleShopPress(defaultShopId, shops.find(s => s.shop_id === defaultShopId).shop_name)}
              style={styles.shopCard}
            >
              <View style={[styles.shopCardTop, { marginBottom: 12 }]}>
                <View style={styles.shopImageContainer}>
                  <Image
                    source={shops.find(s => s.shop_id === defaultShopId)?.profile_picture_url ? { uri: `${API_BASE}${shops.find(s => s.shop_id === defaultShopId)?.profile_picture_url}` } : require('@/assets/images/logo-img.png')}
                    style={shops.find(s => s.shop_id === defaultShopId)?.profile_picture_url ? { width: '100%', height: '100%' } : { width: 44, height: 44 }}
                    resizeMode={shops.find(s => s.shop_id === defaultShopId)?.profile_picture_url ? "cover" : "contain"}
                  />
                </View>
                
                <View style={[styles.shopInfo, { marginRight: 0 }]}>
                  <View style={styles.shopNameRow}>
                    <Text style={styles.shopName} numberOfLines={1}>{shops.find(s => s.shop_id === defaultShopId).shop_name}</Text>
                    <MaterialIcons name="verified" size={16} color="#005CE6" style={{marginLeft: 4}} />
                  </View>
                  
                  <View style={styles.shopStatusRow}>
                    <Text style={getShopStatus(shops.find(s => s.shop_id === defaultShopId)).includes('Closed') ? styles.closedText : styles.openText}>
                      {getShopStatus(shops.find(s => s.shop_id === defaultShopId)).split(' • ')[0]}
                    </Text>
                    {getShopStatus(shops.find(s => s.shop_id === defaultShopId)).includes(' • ') && (
                      <Text style={styles.statusTimeText}> • {getShopStatus(shops.find(s => s.shop_id === defaultShopId)).split(' • ')[1]}</Text>
                    )}
                  </View>

                  <View style={styles.shopStatsRow}>
                    <MaterialIcons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>
                      {shops.find(s => s.shop_id === defaultShopId)?.average_rating ? Number(shops.find(s => s.shop_id === defaultShopId)?.average_rating).toFixed(1) : 'New'}
                      {shops.find(s => s.shop_id === defaultShopId)?.total_ratings > 0 ? ` (${shops.find(s => s.shop_id === defaultShopId)?.total_ratings})` : ''}
                    </Text>
                    <Text style={styles.bulletText}> • </Text>
                    <MaterialIcons name="access-time" size={14} color="#9CA3AF" />
                    <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: '#6B7280', marginLeft: 4 }}>~5 min queue</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.shopCardBottom, { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 }]}>
                <View style={{ flex: 1 }}>
                  <View style={[styles.locationRow, { alignItems: 'flex-start' }]}>
                    <Feather name="map-pin" size={14} color="#6B7280" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.locationText, { marginLeft: 0, fontSize: 13, color: '#4B5563' }]} numberOfLines={1}>
                        {shops.find(s => s.shop_id === defaultShopId).location}
                      </Text>
                      {shops.find(s => s.shop_id === defaultShopId)?.additional_location_details && (
                        <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                          {shops.find(s => s.shop_id === defaultShopId).additional_location_details}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </>
        )}

        {/* Nearby Shops Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{searchQuery.length > 0 ? 'Search Results' : 'Nearby Shops'}</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(searchQuery ? { pathname: '/all-shops', params: { search: searchQuery } } as any : '/all-shops' as any)}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {/* Shops list */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.shopsListContent}
        >
          {filteredShops.length > 0 ? (
            filteredShops.map((shop) => {
              const statusText = getShopStatus(shop);
              const isClosed = statusText.includes('Closed');
              // Randomize wait time for demo visual parity
              const waitTimes = [
                { time: '4 min', color: '#10B981', bg: '#D1FAE5' },
                { time: '10 min', color: '#F59E0B', bg: '#FEF3C7' },
                { time: '18 min', color: '#EF4444', bg: '#FEE2E2' }
              ];
              const wait = waitTimes[shop.shop_id.length % 3];

              return (
                <TouchableOpacity
                  key={shop.shop_id}
                  activeOpacity={0.8}
                  onPress={() => handleShopPress(shop.shop_id, shop.shop_name)}
                  style={styles.shopCardVertical}
                >
                  <View style={styles.shopCardTopRow}>
                    <View style={[styles.waitTimeBadge, { backgroundColor: wait.bg }]}>
                      <Text style={[styles.waitTimeText, { color: wait.color }]}>{wait.time}</Text>
                      <MaterialIcons name="directions-walk" size={12} color={wait.color} style={{ marginLeft: 2 }} />
                    </View>
                  </View>

                  <View style={styles.shopCardLogoContainer}>
                    <Image
                      source={shop.profile_picture_url ? { uri: `${API_BASE}${shop.profile_picture_url}` } : require('@/assets/images/logo-img.png')}
                      style={shop.profile_picture_url ? { width: '100%', height: '100%' } : styles.shopImage}
                      resizeMode={shop.profile_picture_url ? "cover" : "contain"}
                    />
                  </View>

                  <Text style={styles.shopCardTitle} numberOfLines={1}>{shop.shop_name}</Text>
                  <Text style={styles.shopCardLocation} numberOfLines={1}>{shop.location}</Text>

                  <Text style={styles.shopCardStatus} numberOfLines={1}>
                    <Text style={isClosed ? styles.closedText : styles.openText}>
                      {statusText.split(' • ')[0]}
                    </Text>
                    {statusText.includes(' • ') && (
                      <Text style={{ color: '#6B7280' }}> • {statusText.split(' • ')[1]}</Text>
                    )}
                  </Text>

                  <View style={styles.shopCardBottomRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialIcons name="star" size={14} color="#6B7280" />
                      <Text style={styles.shopCardRating}>
                        {shop.average_rating ? Number(shop.average_rating).toFixed(1) : 'New'}
                        {shop.total_ratings > 0 ? ` (${shop.total_ratings})` : ''}
                      </Text>
                    </View>
                    <Text style={styles.shopCardDistance}>
                      {(Math.random() * (1.5 - 0.2) + 0.2).toFixed(1)} km
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40, width: Dimensions.get('window').width - 40 }}>
              <Feather name="search" size={40} color="#9CA3AF" />
              <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: '#6B7280', marginTop: 12, textAlign: 'center' }}>
                {searchQuery.length > 0 ? `No shops found nearby matching "${searchQuery}"` : 'No nearby shops found.'}
              </Text>
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/all-shops', params: { search: searchQuery } } as any)}
                  style={{ marginTop: 16, backgroundColor: '#EFF6FF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
                >
                  <Text style={{ fontFamily: 'Poppins-SemiBold', color: '#005CE6', fontSize: 13 }}>
                    Search globally on map
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        {/* Popular Services Section */}
        {searchQuery.length === 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Services</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.servicesContainer}
            >
              {PopularServicesData.map((service) => (
                <View key={service.id} style={styles.serviceCard}>
                  <View style={styles.serviceIconContainer}>
                    <MaterialIcons name={service.icon as any} size={26} color="#005CE6" />
                  </View>
                  <Text style={styles.serviceLabel}>{service.label}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Large Start Printing Button */}
            <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (!defaultShopId) {
                    Alert.alert('No Default Shop', 'You must choose a default print shop before you can start printing.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Choose Shop', onPress: () => router.push('/all-shops' as any) }
                    ]);
                  } else {
                    const defaultShop = shops.find(s => s.shop_id === defaultShopId);
                    if (defaultShop && getShopStatus(defaultShop).includes('Closed')) {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                      Animated.sequence([
                        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
                        Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
                        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
                        Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
                      ]).start();
                      Alert.alert('Shop is Closed', 'Your default shop is currently closed. Please try again later or choose a different shop.');
                    } else {
                      handleUploadPress();
                    }
                  }
                }} 
                style={styles.uploadButton}
              >
                <View style={styles.plusIconCircle}>
                  <MaterialIcons name="add" size={20} color="#005CE6" />
                </View>
                <Text style={styles.uploadButtonText}>Upload & Start Printing</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  subGreeting: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#4E5D78',
    marginTop: 2,
  },
  bellContainer: {
    position: 'relative',
    padding: 4,
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444', // Red dot badge
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#111827',
  },
  searchDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  filterButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#005CE6',
  },
  shopsListContent: {
    paddingRight: 24,
    paddingBottom: 8,
  },
  shopCardVertical: {
    width: 200,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  shopCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  waitTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  waitTimeText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  shopCardLogoContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAF1FC',
    overflow: 'hidden',
    marginBottom: 12,
  },
  shopImage: {
    width: 40,
    height: 40,
  },
  shopCardTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  shopCardLocation: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginBottom: 6,
  },
  shopCardStatus: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    marginBottom: 12,
  },
  shopCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopCardRating: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
    fontFamily: 'Poppins-Medium',
  },
  shopCardDistance: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  openText: {
    color: '#10B981',
  },
  closedText: {
    color: '#EF4444',
  },
  queueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  queueTime: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  queueLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  servicesContainer: {
    paddingVertical: 12,
    marginBottom: 24,
  },
  serviceCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 85,
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F3F8FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: '#4E5D78',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 15,
  },
  uploadButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#005CE6',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#005CE6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  plusIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF1FC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    color: '#005CE6',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginLeft: 4,
  },
  shopCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    position: 'relative',
  },
  waitTimeBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  waitTimeText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 11,
  },
  shopCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  shopImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  shopInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  shopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 15,
    color: '#111827',
  },
  shopStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusTimeText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#6B7280',
  },
  shopStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
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
  openText: {
    color: '#10B981',
  },
  closedText: {
    color: '#EF4444',
  },
});
