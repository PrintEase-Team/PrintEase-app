import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Linking,
  Platform,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrderStore } from '../store/useOrderStore';
import api, { API_BASE } from '../services/api';

export default function ShopDetailsScreen() {
  const router = useRouter();
  const { selectedShopId } = useOrderStore();
  const { user_id } = useAuthStore();
  const [shop, setShop] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const shakeAnimation = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchShop = async () => {
      if (!selectedShopId) return;
      try {
        const res = await api.get(`/shops/${selectedShopId}`);
        setShop(res.data);
      } catch (err) {
        console.error("Failed to fetch shop:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUserDetails = async () => {
      if (!user_id) return;
      try {
        const res = await api.get(`/users/${user_id}`);
        if (res.data && res.data.default_shop_id === selectedShopId) {
          setIsDefault(true);
        }
      } catch (err) {
        console.error("Failed to fetch user details:", err);
      }
    };

    fetchShop();
    fetchUserDetails();
  }, [selectedShopId, user_id]);

  const toggleDefaultShop = async (value: boolean) => {
    setIsDefault(value);
    try {
      await api.put(`/users/${user_id}/default-shop`, {
        shopId: value ? selectedShopId : null
      });
    } catch (err) {
      console.error("Failed to update default shop:", err);
      setIsDefault(!value); // revert on fail
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${shop?.shop_name || 'this shop'} on PrintEase!`,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleChooseShop = () => {
    if (getShopStatus(shop).includes('Closed')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
      ]).start();
      return;
    }
    router.push('/upload-file' as any);
  };

  const handleOpenMaps = () => {
    if (!shop?.latitude || !shop?.longitude) {
      Alert.alert('Location unavailable', 'This shop has not set their exact map coordinates yet.');
      return;
    }
    const label = encodeURIComponent(shop.shop_name || 'Print Shop');
    const latLng = `${shop.latitude},${shop.longitude}`;
    
    // Create cross-platform Google Maps URL as fallback
    const browserUrl = `https://www.google.com/maps/search/?api=1&query=${latLng}`;
    
    // Native app deep links
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const url = Platform.select({
      ios: `${scheme}${label}&ll=${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    
    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (Platform.OS === 'ios') {
          Linking.openURL(`http://maps.apple.com/?ll=${latLng}&q=${label}`);
        } else if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(browserUrl).catch(() => {
            Alert.alert('Error', 'Could not open map application.');
          });
        }
      });
    } else {
      Linking.openURL(browserUrl).catch(() => {
        Alert.alert('Error', 'Could not open map application.');
      });
    }
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

      if (!todayHours || !todayHours.active) return 'Closed';

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const [openHour, openMin] = todayHours.open.split(':').map(Number);
      const [closeHour, closeMin] = todayHours.close.split(':').map(Number);

      const openTime = openHour * 60 + openMin;
      const closeTime = closeHour * 60 + closeMin;

      if (closeTime < openTime) {
        // Overnight shift (e.g. 06:00 to 03:00 next day)
        if (currentTime >= openTime || currentTime <= closeTime) {
          return `Open • Closes ${todayHours.close}`;
        } else {
          return 'Closed';
        }
      } else {
        // Normal shift
        if (currentTime >= openTime && currentTime <= closeTime) {
          return `Open • Closes ${todayHours.close}`;
        } else {
          return 'Closed';
        }
      }
    } catch (e) {
      return 'Open';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" translucent backgroundColor="transparent" />

        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerButton} activeOpacity={0.7}>
            <Feather name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shop Details</Text>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton} activeOpacity={0.7}>
            <Feather name="share" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.headerButton} activeOpacity={0.7}>
          <Feather name="share" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Image (if available) */}
        {shop?.banner_picture_url && (
          <Image 
            source={{ uri: `${API_BASE}${shop.banner_picture_url}` }} 
            style={{ width: '100%', height: 180, resizeMode: 'cover' }}
          />
        )}

        {/* Shop Info Card */}
        <View style={[styles.shopHeaderContainer, shop?.banner_picture_url ? { marginTop: 8 } : {}]}>
          {/* Shop Image Profile */}
          <View style={[styles.shopImageContainer, shop?.banner_picture_url ? { marginTop: -40, borderColor: '#ffffff', borderWidth: 4 } : {}]}>
            <Image
              source={shop?.profile_picture_url ? { uri: `${API_BASE}${shop.profile_picture_url}` } : require('@/assets/images/logo-img.png')}
              style={shop?.profile_picture_url ? { width: '100%', height: '100%', borderRadius: 12 } : styles.shopImage}
              resizeMode={shop?.profile_picture_url ? "cover" : "contain"}
            />
          </View>

          {/* Shop details column */}
          <View style={styles.shopInfoColumn}>
            <Text style={styles.shopName}>{shop?.shop_name || 'Loading...'}</Text>
            
            <TouchableOpacity onPress={handleOpenMaps} style={{ marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location" size={14} color="#005CE6" />
                <Text style={[styles.shopAddress, { marginTop: 0, marginLeft: 4, color: '#005CE6', textDecorationLine: 'underline' }]}>
                  {shop?.location || '...'}
                </Text>
              </View>
              {shop?.additional_location_details && (
                <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 12, color: '#6B7280', marginTop: 2, marginLeft: 18 }}>
                  {shop.additional_location_details}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.shopStatus}>
              <Text style={getShopStatus(shop).includes('Closed') ? styles.closedText : styles.openText}>
                {getShopStatus(shop)}
              </Text>
            </Text>

            {/* Rating and Est Badge Row */}
            <View style={styles.ratingBadgeRow}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={18} color="#005CE6" />
                <Text style={styles.ratingText}>
                  {shop?.average_rating ? Number(shop.average_rating).toFixed(1) : 'New'} 
                  {shop?.total_ratings > 0 ? ` (${shop.total_ratings})` : ''}
                </Text>
              </View>
              {shop?.established_year && (
                <View style={styles.estBadge}>
                  <Text style={styles.estText}>EST.</Text>
                  <Text style={styles.estText}>{shop.established_year}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsColumn}>
            <Text style={styles.statsVal}>4 min</Text>
            <Text style={styles.statsLbl}>Est. Queue Time</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsColumn}>
            <Text style={styles.statsVal}>{shop?.average_rating ? Number(shop.average_rating).toFixed(1) : 'New'}</Text>
            <Text style={styles.statsLbl}>Rating</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsColumn}>
            <Text style={styles.statsVal}>1.2 km</Text>
            <Text style={styles.statsLbl}>Distance</Text>
          </View>
        </View>

        {/* Pricing Section */}
        {shop && (shop.supports_a4 !== false || shop.supports_a3 !== false || shop.supports_letter !== false || shop.supports_lamination || shop.supports_binding) && (
          <>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.pricingContainer}>
              {/* Printing Header */}
              <View style={styles.pricingHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="print-outline" size={18} color="#005CE6" />
                  <Text style={styles.pricingSectionTitle}>Printing</Text>
                  <Text style={styles.pricingSubText}>(per page)</Text>
                </View>
              </View>

              <View style={styles.pricingColumnsRow}>
                <Text style={styles.pricingColumnHead}>Paper Size</Text>
                <View style={styles.pricingTypeCols}>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={styles.pricingColumnHeadDark}>Black & White</Text>
                    <Text style={styles.pricingSubText}>(per page)</Text>
                  </View>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={styles.pricingColumnHeadDark}>Color</Text>
                    <Text style={styles.pricingSubText}>(per page)</Text>
                  </View>
                </View>
              </View>

              {shop.supports_a4 !== false && (
                <View style={styles.pricingRow}>
                  <View style={{ width: 100 }}>
                    <Text style={styles.pricingSize}>A4</Text>
                    <Text style={styles.pricingSubText}>210 × 297 mm</Text>
                  </View>
                  <View style={styles.pricingValues}>
                    <Text style={styles.pricingValText}>GH¢{(shop.price_a4_bw || 0.5).toFixed(2)}</Text>
                    <View style={styles.pricingValRight}>
                      <Text style={styles.pricingValText}>GH¢{(shop.price_a4_color || 1.0).toFixed(2)}</Text>
                      <Feather name="chevron-right" size={16} color="#94a3b8" />
                    </View>
                  </View>
                </View>
              )}
              {shop.supports_a3 !== false && (
                <View style={styles.pricingRow}>
                  <View style={{ width: 100 }}>
                    <Text style={styles.pricingSize}>A3</Text>
                    <Text style={styles.pricingSubText}>297 × 420 mm</Text>
                  </View>
                  <View style={styles.pricingValues}>
                    <Text style={styles.pricingValText}>GH¢{(shop.price_a3_bw || 1.0).toFixed(2)}</Text>
                    <View style={styles.pricingValRight}>
                      <Text style={styles.pricingValText}>GH¢{(shop.price_a3_color || 2.0).toFixed(2)}</Text>
                      <Feather name="chevron-right" size={16} color="#94a3b8" />
                    </View>
                  </View>
                </View>
              )}
              {shop.supports_letter !== false && (
                <View style={[styles.pricingRow, { borderBottomWidth: 0 }]}>
                  <View style={{ width: 100 }}>
                    <Text style={styles.pricingSize}>Letter</Text>
                    <Text style={styles.pricingSubText}>8.5 × 11 in</Text>
                  </View>
                  <View style={styles.pricingValues}>
                    <Text style={styles.pricingValText}>GH¢{(shop.price_letter_bw || 0.6).toFixed(2)}</Text>
                    <View style={styles.pricingValRight}>
                      <Text style={styles.pricingValText}>GH¢{(shop.price_letter_color || 1.2).toFixed(2)}</Text>
                      <Feather name="chevron-right" size={16} color="#94a3b8" />
                    </View>
                  </View>
                </View>
              )}

              {/* Lamination Section */}
              {shop.supports_lamination && (
                <>
                  <View style={styles.pricingHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="shield-checkmark-outline" size={18} color="#005CE6" />
                      <Text style={styles.pricingSectionTitle}>Lamination</Text>
                      <Text style={styles.pricingSubText}>(per sheet)</Text>
                    </View>
                  </View>
                  <View style={styles.pricingColumnsRow}>
                    <Text style={styles.pricingColumnHead}>Size</Text>
                    <Text style={[styles.pricingColumnHeadDark, { textAlign: 'right', paddingRight: 32 }]}>Price</Text>
                  </View>
                  
                  {shop.price_lamination_a4 != null && (
                    <View style={styles.pricingRow}>
                      <View style={{ width: 100 }}>
                        <Text style={styles.pricingSize}>A4</Text>
                        <Text style={styles.pricingSubText}>210 × 297 mm</Text>
                      </View>
                      <View style={styles.pricingValRight}>
                        <Text style={styles.pricingValText}>GH¢{shop.price_lamination_a4.toFixed(2)}</Text>
                        <Feather name="chevron-right" size={16} color="#94a3b8" />
                      </View>
                    </View>
                  )}
                  {shop.price_lamination_a3 != null && (
                    <View style={styles.pricingRow}>
                      <View style={{ width: 100 }}>
                        <Text style={styles.pricingSize}>A3</Text>
                        <Text style={styles.pricingSubText}>297 × 420 mm</Text>
                      </View>
                      <View style={styles.pricingValRight}>
                        <Text style={styles.pricingValText}>GH¢{shop.price_lamination_a3.toFixed(2)}</Text>
                        <Feather name="chevron-right" size={16} color="#94a3b8" />
                      </View>
                    </View>
                  )}
                  {shop.price_lamination_letter != null && (
                    <View style={[styles.pricingRow, { borderBottomWidth: 0 }]}>
                      <View style={{ width: 100 }}>
                        <Text style={styles.pricingSize}>Letter</Text>
                        <Text style={styles.pricingSubText}>8.5 × 11 in</Text>
                      </View>
                      <View style={styles.pricingValRight}>
                        <Text style={styles.pricingValText}>GH¢{shop.price_lamination_letter.toFixed(2)}</Text>
                        <Feather name="chevron-right" size={16} color="#94a3b8" />
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* Binding Section */}
              {shop.supports_binding && shop.binding_pricing && (
                <>
                  <View style={styles.pricingHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="book-outline" size={18} color="#005CE6" />
                      <Text style={styles.pricingSectionTitle}>Binding</Text>
                      <Text style={styles.pricingSubText}>(price by total sheets)</Text>
                    </View>
                  </View>
                  <View style={styles.pricingColumnsRow}>
                    <Text style={styles.pricingColumnHead}>Binding Type</Text>
                    <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between' }}>
                      <Text style={styles.pricingColumnHeadDark}>Max Sheets</Text>
                      <Text style={[styles.pricingColumnHeadDark, { paddingRight: 32 }]}>Price</Text>
                    </View>
                  </View>
                  
                  {(() => {
                    try {
                      const tiers = JSON.parse(shop.binding_pricing);
                      return tiers.map((tier: any, index: number) => (
                        <View key={index} style={[styles.pricingRow, index === tiers.length - 1 && { borderBottomWidth: 0 }]}>
                          <View style={{ width: 100 }}>
                            <Text style={styles.pricingSize}>Comb Binding</Text>
                          </View>
                          <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.pricingValText}>{tier.min} - {tier.max} <Text style={{ fontSize: 10, color: '#6B7280' }}>sheets</Text></Text>
                            <View style={styles.pricingValRight}>
                              <Text style={styles.pricingValText}>GH¢{tier.price.toFixed(2)}</Text>
                              <Feather name="chevron-right" size={16} color="#94a3b8" />
                            </View>
                          </View>
                        </View>
                      ));
                    } catch (e) {
                      return null;
                    }
                  })()}
                </>
              )}

              <View style={styles.pricingFooter}>
                <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
                <Text style={styles.pricingFooterText}>All prices are per sheet (one side). Double-sided prices may vary.</Text>
              </View>
            </View>
          </>
        )}

        {/* Services Section */}
        {shop?.services_offered && (() => {
          try {
            const services = JSON.parse(shop.services_offered);
            if (services.length === 0) return null;
            return (
              <>
                <Text style={styles.sectionTitle}>Services Offered</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesRow}>
                  {services.map((service: string) => {
                    let iconName = 'print-outline';
                    if (service === 'Photocopy') iconName = 'copy-outline';
                    if (service === 'Scan') iconName = 'scan-outline';
                    if (service === 'Bind') iconName = 'book-outline';
                    if (service === 'Lamination') iconName = 'shield-checkmark-outline';
                    return (
                      <View key={service} style={styles.serviceCard}>
                        <Ionicons name={iconName as any} size={28} color="#005CE6" />
                        <Text style={styles.serviceText}>{service}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
                <View style={styles.paginationDots}>
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              </>
            );
          } catch (e) {
            return null;
          }
        })()}

        {/* Default Shop Toggle Card */}
        <View style={styles.defaultShopCard}>
          <View style={styles.defaultShopIconContainer}>
            <Ionicons name="star-outline" size={24} color="#005CE6" />
          </View>
          <View style={styles.defaultShopTextContainer}>
            <Text style={styles.defaultShopTitle}>Default shop</Text>
            <Text style={styles.defaultShopDescription}>
              Set this shop as your default for faster checkouts and a better experience
            </Text>
          </View>
          <Switch
            value={isDefault}
            onValueChange={toggleDefaultShop}
            trackColor={{ false: '#D1D5DB', true: '#BFDBFE' }}
            thumbColor={isDefault ? '#005CE6' : '#FFFFFF'}
          />
        </View>

        {/* Blue Student Trust Card */}
        <View style={styles.trustCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#005CE6" style={styles.trustIcon} />
          <View style={styles.trustTextContainer}>
            <Text style={styles.trustTitle}>Trusted by students</Text>
            <Text style={styles.trustDescription}>
              Fast, reliable and affordable printing services for all KNUST students.
            </Text>
          </View>
        </View>

        {/* Choose This Shop Button */}
        <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
          <TouchableOpacity
            onPress={handleChooseShop}
            style={[styles.chooseButton, getShopStatus(shop).includes('Closed') && { backgroundColor: '#9CA3AF' }]}
            disabled={getShopStatus(shop).includes('Closed')}
            activeOpacity={0.8}
          >
            <Text style={styles.chooseButtonText}>
              {getShopStatus(shop).includes('Closed') ? 'Shop is Closed' : 'Choose This Shop'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
  headerButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  shopHeaderContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  shopImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 16,
    backgroundColor: '#F3F8FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAF1FC',
    overflow: 'hidden',
  },
  shopImage: {
    width: 76,
    height: 76,
  },
  shopInfoColumn: {
    flex: 1,
    marginLeft: 16,
    paddingTop: 8,
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    lineHeight: 28,
  },
  shopAddress: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  shopStatus: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 6,
  },
  openText: {
    color: '#10B981',
    fontFamily: 'Poppins-Medium',
  },
  closedText: {
    color: '#EF4444',
    fontFamily: 'Poppins-Medium',
  },
  ratingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#4B5563',
    marginLeft: 6,
  },
  estBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#005CE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  estText: {
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    color: '#005CE6',
    lineHeight: 11,
    textAlign: 'center',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 18,
    marginHorizontal: 24,
    marginTop: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  statsColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statsVal: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  statsLbl: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 4,
  },
  statsDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 12,
  },
  pricingContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pricingSize: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  pricingHeaderRow: {
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  pricingSectionTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#1E293B',
    marginLeft: 6,
  },
  pricingSubText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
    marginLeft: 4,
    marginTop: 2,
  },
  pricingColumnsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  pricingColumnHead: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: '#64748B',
    width: 100,
  },
  pricingColumnHeadDark: {
    fontSize: 11,
    fontFamily: 'Poppins-SemiBold',
    color: '#334155',
  },
  pricingTypeCols: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  pricingValues: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  pricingValText: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#334155',
  },
  pricingValRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  pricingFooterText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
  },
  servicesRow: {
    paddingHorizontal: 24,
    paddingVertical: 4,
    gap: 12,
  },
  serviceCard: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#334155',
    marginTop: 12,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 16,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#005CE6',
  },
  defaultShopCard: {
    backgroundColor: '#FAFBFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAF1FC',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 24,
  },
  defaultShopIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  defaultShopTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  defaultShopTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  defaultShopDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  trustCard: {
    flexDirection: 'row',
    backgroundColor: '#F3F8FE',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 24,
    alignItems: 'flex-start',
  },
  trustIcon: {
    marginTop: 2,
  },
  trustTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  trustTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  trustDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    marginTop: 4,
  },
  chooseButton: {
    backgroundColor: '#005CE6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 24,
    shadowColor: '#005CE6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  chooseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});
