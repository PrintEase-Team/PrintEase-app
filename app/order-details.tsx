import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useOrderStore } from '../store/useOrderStore';

export default function OrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract params with fallback defaults
  const orderId = (params.orderId as string) || '#PE-UNKNOWN';
  const shopId = params.shopId as string;
  const shopName = (params.shopName as string) || 'Unknown Shop';
  const shopLocation = (params.shopLocation as string) || 'Unknown Location';
  const documentName = (params.documentName as string) || 'Unknown Document';
  const pagesInfo = (params.pagesInfo as string) || 'Loading...';
  const price = (params.price as string) || 'GHS --';
  const initialStatus = (params.status as string) || 'Active';
  const [currentStatus, setCurrentStatus] = React.useState(initialStatus);

  React.useEffect(() => {
    if (!rawId || currentStatus === 'Collected' || currentStatus === 'Completed' || currentStatus === 'Cancelled') return;
    
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/orders/${rawId}`);
        if (res.data && res.data.status) {
          const newStatus = res.data.status;
          if (newStatus !== currentStatus) {
            setCurrentStatus(newStatus);
            if (newStatus === 'Collected' || newStatus === 'Completed') {
              setShowRatingModal(true);
            }
          }
        }
      } catch (error) {
        // Silently ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [rawId, currentStatus]);
  const date = (params.date as string) || 'N/A';
  const fileType = (params.fileType as string) || 'pdf';
  const pickupCode = (params.pickupCode as string) || '------';
  const rawId = params.rawId as string;
  const { clearCurrentOrder } = useOrderStore();
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const [ratingScore, setRatingScore] = React.useState(0);
  const [submittingRating, setSubmittingRating] = React.useState(false);

  const handleBack = () => {
    router.replace('/(tabs)/orders' as any);
  };

  const getStatusBadgeStyle = (statusStr: string) => {
    switch (statusStr) {
      case 'Active':
        return { bg: '#E8F2FF', text: '#005CE6' };
      case 'Printing':
        return { bg: '#FFF0E6', text: '#F97316' };
      case 'Ready':
        return { bg: '#EAFCEF', text: '#10B981' };
      case 'Completed':
        return { bg: '#F3F4F6', text: '#6B7280' };
      case 'Cancelled':
        return { bg: '#FEE2E2', text: '#EF4444' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const badgeStyle = getStatusBadgeStyle(currentStatus);

  const handleConfirmPickup = () => {
    Alert.alert(
      'Confirm Collection',
      'Have you collected your prints from the shop?',
      [
        { text: 'Not Yet', style: 'cancel' },
        { 
          text: 'Yes, I got it', 
          onPress: async () => {
            try {
              if (rawId) {
                await api.put(`/orders/${rawId}`, { status: 'Collected' });
              }
              clearCurrentOrder();
              setShowRatingModal(true);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to update order status.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Rating Modal */}
      <React.Fragment>
        {showRatingModal && (
          <View style={StyleSheet.absoluteFill}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Rate your experience</Text>
                <Text style={styles.modalSubtitle}>How was your experience at {shopName}?</Text>
                
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRatingScore(star)}>
                      <Feather 
                        name="star" 
                        size={36} 
                        color={star <= ratingScore ? "#F59E0B" : "#D1D5DB"} 
                        style={{ marginHorizontal: 8 }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity 
                  style={[styles.modalButton, ratingScore === 0 && styles.modalButtonDisabled]} 
                  disabled={ratingScore === 0 || submittingRating}
                  onPress={async () => {
                    if (shopId && rawId) {
                      setSubmittingRating(true);
                      try {
                        await api.post(`/shops/${shopId}/rate`, { 
                          orderId: rawId, 
                          score: ratingScore 
                        });
                        Alert.alert('Thank you!', 'Your feedback helps improve the service.');
                        setShowRatingModal(false);
                        router.replace('/(tabs)/orders' as any);
                      } catch (e: any) {
                        Alert.alert('Notice', e.response?.data?.message || 'Failed to submit rating, but your order is collected.');
                        setShowRatingModal(false);
                        router.replace('/(tabs)/orders' as any);
                      } finally {
                        setSubmittingRating(false);
                      }
                    } else {
                      setShowRatingModal(false);
                      router.replace('/(tabs)/orders' as any);
                    }
                  }}
                >
                  <Text style={styles.modalButtonText}>
                    {submittingRating ? 'Submitting...' : 'Submit Rating'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalSkipButton}
                  disabled={submittingRating}
                  onPress={() => {
                    setShowRatingModal(false);
                    router.replace('/(tabs)/orders' as any);
                  }}
                >
                  <Text style={styles.modalSkipButtonText}>Skip for now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </React.Fragment>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Order Details</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: badgeStyle.bg }]}>
            <Text style={[styles.statusText, { color: badgeStyle.text }]}>{currentStatus}</Text>
          </View>
          <Text style={styles.orderNumber}>{orderId}</Text>
          <Text style={styles.orderPlacedText}>Ordered on {date}</Text>
        </View>

        {/* Print Shop Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Print Shop</Text>
          <View style={styles.row}>
            <View style={styles.shopIconContainer}>
              <Feather name="home" size={20} color="#005CE6" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.boldText}>{shopName}</Text>
              <Text style={styles.subText}>{shopLocation}</Text>
            </View>
          </View>
        </View>

        {/* Document Details Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Document Details</Text>
          <View style={styles.row}>
            <View
              style={[
                styles.fileIconContainer,
                { backgroundColor: fileType === 'pdf' ? '#EF4444' : '#2563EB' },
              ]}
            >
              <Text style={styles.fileTypeText}>{fileType === 'pdf' ? 'PDF' : 'W'}</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.boldText} numberOfLines={1}>{documentName}</Text>
              <Text style={styles.subText}>{pagesInfo}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Amount Paid</Text>
            <Text style={styles.priceValue}>{price}</Text>
          </View>
        </View>

        {/* Pickup Code Section — always visible after order is placed */}
        {currentStatus !== 'Cancelled' && (
          <View style={styles.pickupCard}>
            <Text style={styles.pickupTitle}>Your Pickup Code</Text>
            <View style={styles.codeRow}>
              {String(pickupCode).padStart(6, '0').split('').map((digit, index) => (
                <View key={index} style={styles.codeBox}>
                  <Text style={styles.codeDigit}>{digit}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.pickupHelper}>
              {currentStatus === 'Ready'
                ? 'Your prints are ready! Show this code at the shop to collect.'
                : currentStatus === 'Collected'
                ? 'Order completed. Keep this code for your records.'
                : 'Save this code — you\'ll need it to collect your prints when ready.'}
            </Text>
          </View>
        )}

        {currentStatus === 'Ready' && (
          <TouchableOpacity onPress={handleConfirmPickup} style={{ marginTop: 8, marginBottom: 16, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 2 }}>
            <Text style={{ color: '#ffffff', fontFamily: 'Poppins-Bold', fontSize: 15 }}>I have taken this order</Text>
          </TouchableOpacity>
        )}

        {/* Help / Support Action */}
        <TouchableOpacity style={styles.helpButton} activeOpacity={0.8}>
          <Feather name="help-circle" size={20} color="#6B7280" />
          <Text style={styles.helpButtonText}>Need Help with this Order?</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 6,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    textTransform: 'uppercase',
  },
  orderNumber: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  orderPlacedText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F8FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileIconContainer: {
    width: 36,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileTypeText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
  },
  textContainer: {
    flex: 1,
  },
  boldText: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  subText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  priceValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#005CE6',
  },
  pickupCard: {
    backgroundColor: '#F9FCFF',
    borderWidth: 1,
    borderColor: '#E8F2FF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  pickupTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#1E3A8A',
    marginBottom: 16,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  codeBox: {
    width: 40,
    height: 48,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#D1E5FF',
    borderRadius: 12,
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#005CE6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  codeDigit: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#005CE6',
  },
  pickupHelper: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  helpButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#4B5563',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  modalButton: {
    backgroundColor: '#005CE6',
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  modalSkipButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalSkipButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  }
});
