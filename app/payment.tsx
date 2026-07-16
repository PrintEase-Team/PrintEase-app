import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Paystack } from 'react-native-paystack-webview';
import { paymentService } from '@/services/paymentService';
import { useOrderStore } from '@/store/useOrderStore';

export default function PaymentScreen() {
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const { currentOrderId, totalAmount } = useOrderStore();
  const paystackWebViewRef = useRef<any>(null);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    if (!currentOrderId || !totalAmount) {
      Alert.alert('Error', 'Missing order details.');
      return;
    }

    try {
      setIsProcessing(true);
      // Create Pending Payment on our backend first
      const payment = await paymentService.createPayment({
        order_id: currentOrderId,
        amount: totalAmount,
        payment_method: 'Paystack',
      });
      setCurrentPaymentId(payment.payment_id);
      
      // Open Paystack modal
      paystackWebViewRef.current.startTransaction();
      
    } catch (e: any) {
      console.error(e);
      Alert.alert('Payment Initialization Failed', 'Could not create payment record.');
      setIsProcessing(false);
    }
  };

  const handlePaystackSuccess = async (reference: string) => {
    if (!currentPaymentId) return;
    try {
      // Send reference to backend to securely verify and confirm
      await paymentService.confirmPayment(currentPaymentId, reference);
      setIsProcessing(false);
      router.push('/order-success' as any);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Verification Failed', 'Payment was made but could not be verified on our server.');
      setIsProcessing(false);
    }
  };

  const handlePaystackCancel = () => {
    setIsProcessing(false);
    Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
  };

  // Payment Methods Data matching design list
  const paymentMethods = [
    {
      id: 'mtn',
      title: 'MTN Mobile Money',
      subtitle: 'Pay with MTN MoMo',
      logoType: 'mtn',
    },
    {
      id: 'telecel',
      title: 'Telecel Cash',
      subtitle: 'Pay with Telecel Cash',
      logoType: 'telecel',
    },
    {
      id: 'airteltigo',
      title: 'AirtelTigo Money',
      subtitle: 'Pay with AirtelTigo Money',
      logoType: 'airteltigo',
    },
    {
      id: 'visa',
      title: 'Visa',
      subtitle: 'Pay with Visa Card',
      logoType: 'visa',
    },
    {
      id: 'mastercard',
      title: 'Mastercard',
      subtitle: 'Pay with Mastercard',
      logoType: 'mastercard',
    },
  ];

  // Helper to render high-fidelity payment logos in pure StyleSheet code
  const renderLogo = (type: string) => {
    switch (type) {
      case 'mtn':
        return (
          <View style={styles.mtnLogo}>
            <View style={styles.mtnOval}>
              <Text style={styles.mtnText}>mtn</Text>
            </View>
          </View>
        );
      case 'telecel':
        return (
          <View style={styles.telecelLogo}>
            <Text style={styles.telecelText}>t</Text>
          </View>
        );
      case 'airteltigo':
        return (
          <View style={styles.airteltigoLogo}>
            <Text style={styles.airteltigoText}>airtel</Text>
            <Text style={styles.airteltigoSubText}>tigo</Text>
          </View>
        );
      case 'visa':
        return (
          <View style={styles.logoWrapper}>
            <View style={styles.visaLogo}>
              <Text style={styles.visaText}>VISA</Text>
            </View>
          </View>
        );
      case 'mastercard':
        return (
          <View style={styles.logoWrapper}>
            <View style={styles.mastercardContainer}>
              <View style={styles.mcRedCircle} />
              <View style={styles.mcOrangeCircle} />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Payment</Text>
          <Text style={styles.headerSubtitle}>Step 4 of 4</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Red Notice Banner */}
        <View style={styles.noticeBanner}>
          <Ionicons name="information-circle-outline" size={22} color="#DC2626" style={styles.noticeIcon} />
          <Text style={styles.noticeText}>
            <Text style={styles.noticeBold}>Notice! </Text>
            After MoMo approval, click on {"I've completed payment"} to verify your payment.
          </Text>
        </View>

        {/* Main Card Container */}
        <View style={styles.mainCard}>
          {/* Total Amount Row */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>GHS {totalAmount ? totalAmount.toFixed(2) : '0.00'}</Text>
          </View>

          {/* Card Divider */}
          <View style={styles.cardDivider} />

          {/* Subheading */}
          <Text style={styles.subheading}>You will be redirected to Paystack to pay with</Text>

          {/* Payment Methods List */}
          <View style={styles.methodsList}>
            {paymentMethods.map((method, index) => (
              <View key={method.id}>
                <View style={styles.methodItem}>
                  {/* Left part: Logo and Details */}
                  <View style={styles.methodDetails}>
                    <View style={styles.logoContainer}>
                      {renderLogo(method.logoType)}
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.methodTitle}>{method.title}</Text>
                      <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
                    </View>
                  </View>

                  {/* Right part: Supported lock badge */}
                  <View style={styles.supportedBadge}>
                    <Ionicons name="lock-closed-outline" size={10} color="#6B7280" style={styles.badgeLockIcon} />
                    <Text style={styles.supportedText}>Supported</Text>
                  </View>
                </View>

                {/* Inner divider (except for last item) */}
                {index < paymentMethods.length - 1 && <View style={styles.itemDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Blue Secure Payment Banner */}
        <View style={styles.secureBanner}>
          <View style={styles.secureIconCircle}>
            <Feather name="lock" size={20} color="#ffffff" />
          </View>
          <View style={styles.secureTextContainer}>
            <Text style={styles.secureTitle}>100% Secure Payment</Text>
            <Text style={styles.secureDescription}>
              You will be safely redirected to Paystack to complete your payment securely.
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleContinue}
          style={styles.continueButton}
          activeOpacity={0.8}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <View style={styles.buttonCenterContent}>
                <Feather name="lock" size={18} color="#ffffff" style={styles.buttonLockIcon} />
                <Text style={styles.continueButtonText}>Pay with Paystack</Text>
              </View>
              <Feather name="arrow-right" size={20} color="#ffffff" style={styles.buttonArrowIcon} />
            </>
          )}
        </TouchableOpacity>

        {/* Brand Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Secured by</Text>
          <View style={styles.paystackLogoIcon}>
            <View style={[styles.paystackLine, { width: 10 }]} />
            <View style={[styles.paystackLine, { width: 14 }]} />
            <View style={[styles.paystackLine, { width: 8 }]} />
          </View>
          <Text style={styles.paystackWordmark}>paystack</Text>
        </View>

        {/* Hidden Paystack component */}
        <Paystack
          paystackKey="pk_test_fc9b29dd5dcf28a34c9d07a904d4ae06d57576d1" // Test public key
          amount={totalAmount || 0} // react-native-paystack-webview expects GHS (not pesewas)
          billingEmail="student@university.edu" // Replace with actual user email from state
          activityIndicatorColor="#005CE6"
          onCancel={handlePaystackCancel}
          onSuccess={(res: any) => handlePaystackSuccess(res?.transactionRef?.reference || res?.reference || 'test_ref')}
          autoStart={false}
          ref={paystackWebViewRef}
          currency="GHS"
        />

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
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    marginTop: 2,
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  noticeBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  noticeIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#9F1239',
    lineHeight: 18,
  },
  noticeBold: {
    fontFamily: 'Poppins-Bold',
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#005CE6',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 18,
  },
  subheading: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 16,
  },
  methodsList: {
    marginTop: 4,
  },
  methodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  methodDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    justifyContent: 'center',
  },
  methodTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  methodSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  supportedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeLockIcon: {
    marginRight: 4,
  },
  supportedText: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F9FAFB',
    marginVertical: 4,
  },
  // Logo Render Styles
  mtnLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFCC00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mtnOval: {
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mtnText: {
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    color: '#000000',
    lineHeight: 10,
  },
  telecelLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E41C1C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  telecelText: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
    marginTop: -5,
  },
  airteltigoLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#002870',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
  airteltigoText: {
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
    lineHeight: 10,
  },
  airteltigoSubText: {
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    color: '#ffffff',
    lineHeight: 10,
    marginTop: -2,
  },
  logoWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  visaLogo: {
    width: 36,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visaText: {
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    color: '#0A2540',
  },
  mastercardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 20,
  },
  mcRedCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EB001B',
    marginRight: -7,
  },
  mcOrangeCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F79E1B',
    opacity: 0.95,
  },
  // Secure Banner Styles
  secureBanner: {
    flexDirection: 'row',
    backgroundColor: '#F3F8FE',
    borderWidth: 1,
    borderColor: '#EAF1FC',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 20,
    alignItems: 'center',
  },
  secureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#005CE6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  secureTextContainer: {
    flex: 1,
  },
  secureTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  secureDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#4B5563',
    lineHeight: 18,
    marginTop: 2,
  },
  // Continue Button
  continueButton: {
    backgroundColor: '#005CE6',
    height: 56,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    shadowColor: '#005CE6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonCenterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLockIcon: {
    marginRight: 8,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  buttonArrowIcon: {
    position: 'absolute',
    right: 20,
  },
  // Footer Styles
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  paystackLogoIcon: {
    width: 16,
    height: 10,
    justifyContent: 'space-between',
    marginHorizontal: 6,
  },
  paystackLine: {
    height: 2,
    backgroundColor: '#00C5FF',
    borderRadius: 1,
  },
  paystackWordmark: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#0A2540',
  },
});
