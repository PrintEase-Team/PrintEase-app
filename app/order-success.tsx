import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useOrderStore } from '@/store/useOrderStore';
import api from '@/services/api';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { currentOrderId } = useOrderStore();
  const [pickupCode, setPickupCode] = useState(['-', '-', '-', '-', '-', '-']);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (currentOrderId) {
        try {
          const res = await api.get(`/orders/${currentOrderId}/full`);
          if (res.data) {
             setOrderData(res.data);
             if (res.data.order && res.data.order.pickup_code) {
               const codeString = String(res.data.order.pickup_code).padStart(6, '0');
               setPickupCode(codeString.split(''));
             }
          }
        } catch(e) {
          console.error("Failed to fetch pickup code:", e);
        }
      }
    };
    fetchOrder();
  }, [currentOrderId]);

  const handleViewOrders = () => {
    // Navigate to the Orders Tab
    router.replace('/(tabs)/orders' as any);
  };

  const handleBackHome = () => {
    // Navigate to the Home Tab
    router.replace('/(tabs)' as any);
  };

  const file = orderData?.files && orderData.files.length > 0 ? orderData.files[0] : null;
  const settings = orderData?.printSettings && orderData.printSettings.length > 0 ? orderData.printSettings[0] : null;

  const fileName = file?.file_name || 'Document.pdf';
  const price = orderData?.order?.total_amount != null ? `GHS ${Number(orderData.order.total_amount).toFixed(2)}` : 'GHS --';
  const fileType = file?.file_type?.includes('pdf') ? 'PDF' : file?.file_type?.includes('image') ? 'IMG' : 'DOC';
  const pagesInfo = `${file?.page_count ? file.page_count + ' pages • ' : ''}${settings?.copies ? settings.copies + ' copies • ' : ''}${settings?.color_mode === 'Colored' ? 'Color' : 'Black & White'} • ${settings?.sided === 'Double_sided' ? 'Double Sided' : 'Single Sided'}`;
  const dateStr = orderData?.order?.submitted_at ? new Date(orderData.order.submitted_at).toLocaleString() : 'N/A';
  const shopName = orderData?.order?.shop?.shop_name || 'My Print Shop';
  const shopLocation = orderData?.order?.shop?.location || '...';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Illustration with Confetti & Checkmark */}
        <View style={styles.illustrationContainer}>
          {/* Confetti Elements */}
          <View style={[styles.confetti, styles.confettiRed1]} />
          <View style={[styles.confetti, styles.confettiBlue1]} />
          <View style={[styles.confetti, styles.confettiYellow1]} />
          <View style={[styles.confetti, styles.confettiGreen1]} />
          <View style={[styles.confetti, styles.confettiBlueDot1]} />
          <View style={[styles.confetti, styles.confettiYellowDot1]} />
          <View style={[styles.confetti, styles.confettiBlue2]} />
          <View style={[styles.confetti, styles.confettiBlue3]} />
          <View style={[styles.confetti, styles.confettiRed2]} />

          {/* Success Badge */}
          <View style={styles.successBadge}>
            <Ionicons name="checkmark" size={48} color="#005CE6" />
          </View>
        </View>

        {/* Status Headings */}
        <Text style={styles.title}>Print Job Confirmed!</Text>
        <Text style={styles.subtitle}>
          Your order has been received and is being processed.
        </Text>

        {/* Pickup Code Card */}
        <View style={styles.pickupCodeCard}>
          <Text style={styles.pickupCodeTitle}>Your Pickup Code</Text>
          <View style={styles.codeRow}>
            {pickupCode.map((digit, index) => (
              <View key={index} style={styles.codeBox}>
                <Text style={styles.codeDigit}>{digit}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.pickupCodeHelper}>
            Show this code at the shop to collect your prints.
          </Text>
        </View>

        {/* Order Details List */}
        <View style={styles.infoCard}>
          {/* Shop Row */}
          <View style={styles.infoRow}>
            <View style={styles.shopImageContainer}>
              <Image
                source={require('@/assets/images/logo-img.png')}
                style={styles.shopImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.shopTextContainer}>
              <Text style={styles.shopName}>{shopName}</Text>
              <Text style={styles.shopLocation}>{shopLocation}</Text>
            </View>
            <Text style={styles.shopTime}>4 min</Text>
          </View>

          <View style={styles.infoDivider} />

          {/* File Row */}
          <View style={styles.infoRow}>
            <View style={styles.pdfIconContainer}>
              <Text style={styles.pdfText}>{fileType}</Text>
            </View>
            <View style={styles.fileTextContainer}>
              <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
              <Text style={styles.fileDetails}>{pagesInfo}</Text>
            </View>
            <Text style={styles.filePrice}>{price}</Text>
          </View>

          <View style={styles.infoDivider} />

          {/* Date Row */}
          <View style={styles.infoRow}>
            <View style={styles.calendarIconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#005CE6" />
            </View>
            <View style={styles.dateTextContainer}>
              <Text style={styles.dateTitle}>Order Placed</Text>
              <Text style={styles.dateValue}>{dateStr}</Text>
            </View>
          </View>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          onPress={handleViewOrders}
          style={styles.viewOrdersButton}
          activeOpacity={0.8}
        >
          <Feather name="inbox" size={20} color="#ffffff" />
          <Text style={styles.viewOrdersText}>View My Orders</Text>
        </TouchableOpacity>

        {/* Secondary Outlined Button */}
        <TouchableOpacity
          onPress={handleBackHome}
          style={styles.backHomeButton}
          activeOpacity={0.8}
        >
          <Feather name="home" size={20} color="#005CE6" />
          <Text style={styles.backHomeText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 10,
  },
  illustrationContainer: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 24,
  },
  successBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#005CE6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    zIndex: 10,
  },
  confetti: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
  },
  confettiRed1: {
    width: 14,
    backgroundColor: '#EF4444',
    top: 30,
    left: '24%',
    transform: [{ rotate: '35deg' }],
  },
  confettiBlue1: {
    width: 16,
    backgroundColor: '#005CE6',
    top: 65,
    left: '27%',
    transform: [{ rotate: '-25deg' }],
  },
  confettiYellow1: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    bottom: 45,
    left: '21%',
  },
  confettiGreen1: {
    width: 12,
    backgroundColor: '#10B981',
    bottom: 30,
    left: '32%',
    transform: [{ rotate: '55deg' }],
  },
  confettiBlueDot1: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#3B82F6',
    top: 20,
    left: '42%',
  },
  confettiYellowDot1: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#F59E0B',
    top: 25,
    right: '38%',
  },
  confettiBlue2: {
    width: 12,
    backgroundColor: '#3B82F6',
    top: 40,
    right: '25%',
    transform: [{ rotate: '15deg' }],
  },
  confettiBlue3: {
    width: 14,
    backgroundColor: '#005CE6',
    top: 70,
    right: '28%',
    transform: [{ rotate: '-35deg' }],
  },
  confettiRed2: {
    width: 12,
    backgroundColor: '#EF4444',
    bottom: 32,
    right: '23%',
    transform: [{ rotate: '40deg' }],
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    textAlign: 'center',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 36,
    marginTop: 8,
  },
  pickupCodeCard: {
    backgroundColor: '#F9FCFF',
    borderWidth: 1,
    borderColor: '#E8F2FF',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    marginTop: 24,
    alignItems: 'center',
  },
  pickupCodeTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#4B5563',
    marginBottom: 16,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  codeBox: {
    width: 46,
    height: 58,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  codeDigit: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#005CE6',
  },
  pickupCodeHelper: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  shopImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F3F8FE',
    borderWidth: 1,
    borderColor: '#EAF1FC',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  shopImage: {
    width: '100%',
    height: '100%',
  },
  shopTextContainer: {
    flex: 1,
  },
  shopName: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  shopLocation: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 1,
  },
  shopTime: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: '#005CE6',
  },
  pdfIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pdfText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
  },
  fileTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  fileDetails: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 1,
  },
  filePrice: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  calendarIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F8FE',
    borderWidth: 1,
    borderColor: '#EAF1FC',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  dateValue: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 1,
  },
  viewOrdersButton: {
    backgroundColor: '#005CE6',
    height: 56,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#005CE6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  viewOrdersText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
  backHomeButton: {
    backgroundColor: '#ffffff',
    borderColor: '#005CE6',
    borderWidth: 1.5,
    height: 56,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHomeText: {
    color: '#005CE6',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
});
