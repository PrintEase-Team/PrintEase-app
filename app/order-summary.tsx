import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrderStore } from '@/store/useOrderStore';
import { fileService } from '@/services/fileService';

import api from '@/services/api';

export default function OrderSummaryScreen() {
  const router = useRouter();

  const { currentOrderId, currentFileId, totalAmount } = useOrderStore();
  const [isLoading, setIsLoading] = useState(true);

  // Local state holding order details
  const [orderData, setOrderData] = useState({
    shopName: 'Loading...',
    shopLocation: '...',
    queueTime: 'Calculating...',
    fileName: 'Loading...',
    filePages: 1,
    fileSize: '0 KB',
    copies: 1,
    colorMode: 'Black & White',
    paperSize: 'Unknown',
    doubleSided: 'Yes',
    totalAmount: `GHS ${totalAmount ? totalAmount.toFixed(2) : '0.00'}`,
  });

  useEffect(() => {
    const fetchFullOrder = async () => {
      if (currentOrderId) {
        try {
          const response = await api.get(`/orders/${currentOrderId}/full`);
          const data = response.data;
          
          const file = data.files && data.files.length > 0 ? data.files[0] : null;
          const settings = data.printSettings && data.printSettings.length > 0 ? data.printSettings[0] : null;
          
          setOrderData(prev => ({
            ...prev,
            shopName: data.order?.shop?.shop_name || 'My Print Shop',
            shopLocation: data.order?.shop?.location || '...',
            fileName: file ? file.file_name : 'No file',
            fileSize: file && file.file_size_kb ? `${file.file_size_kb} KB` : 'Unknown',
            filePages: file && file.page_count ? file.page_count : 1,
            copies: settings ? settings.copies : 1,
            colorMode: settings && settings.color_mode ? settings.color_mode.replace('_', ' ') : 'Black & White',
            paperSize: settings && settings.paper_size ? settings.paper_size.toUpperCase() : 'A4',
            doubleSided: settings && settings.sided === 'Double_sided' ? 'Yes' : 'No',
            totalAmount: data.order && data.order.total_amount ? `GHS ${data.order.total_amount.toFixed(2)}` : `GHS ${totalAmount ? totalAmount.toFixed(2) : '0.00'}`
          }));
        } catch (e) {
          console.error("Failed to fetch full order data:", e);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    fetchFullOrder();
  }, [currentOrderId, totalAmount]);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    router.push('/payment' as any);
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
          <Text style={styles.headerTitle}>Order Summary</Text>
          <Text style={styles.headerSubtitle}>Step 3 of 4</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#005CE6" />
        </View>
      ) : (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Selected Print Shop Card */}
        <View style={styles.shopCard}>
          <View style={styles.shopImageContainer}>
            <Image
              source={require('@/assets/images/logo-img.png')}
              style={styles.shopImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.shopInfoContainer}>
            <Text style={styles.shopName}>{orderData.shopName}</Text>
            <Text style={styles.shopLocation}>{orderData.shopLocation}</Text>
          </View>
          <View style={styles.queueContainer}>
            <Text style={styles.queueTime}>{orderData.queueTime}</Text>
            <Text style={styles.queueLabel}>queue</Text>
          </View>
        </View>

        {/* Uploaded File Card */}
        <TouchableOpacity style={styles.fileCard} activeOpacity={0.8}>
          <View style={styles.pdfIconContainer}>
            <Text style={styles.pdfText}>PDF</Text>
          </View>
          <View style={styles.fileInfoContainer}>
            <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
              {orderData.fileName}
            </Text>
            <Text style={styles.fileDetails}>
              {orderData.filePages} pages • {orderData.fileSize}
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Summary Title */}
        <Text style={styles.summaryTitle}>Summary</Text>

        {/* Summary List */}
        <View style={styles.summaryList}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Copies</Text>
            <Text style={styles.summaryValue}>{orderData.copies}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Color</Text>
            <Text style={styles.summaryValue}>{orderData.colorMode}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Paper Size</Text>
            <Text style={styles.summaryValue}>{orderData.paperSize}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Double-sided</Text>
            <Text style={styles.summaryValue}>{orderData.doubleSided}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Pages</Text>
            <Text style={styles.summaryValue}>{orderData.filePages}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Total Amount */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>{orderData.totalAmount}</Text>
          </View>
        </View>

        {/* Review Notice Banner */}
        <View style={styles.noticeBanner}>
          <Ionicons name="information-circle" size={22} color="#005CE6" />
          <Text style={styles.noticeText}>
            Review your order details before proceeding to payment.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleContinue}
          style={styles.continueButton}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue to Payment</Text>
        </TouchableOpacity>
      </ScrollView>
      )}
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
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  shopImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F8FE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAF1FC',
    overflow: 'hidden',
    marginRight: 16,
  },
  shopImage: {
    width: '100%',
    height: '100%',
  },
  shopInfoContainer: {
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
    marginTop: 2,
  },
  queueContainer: {
    alignItems: 'flex-end',
  },
  queueTime: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: '#10B981',
  },
  queueLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  pdfIconContainer: {
    width: 42,
    height: 48,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pdfText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
  },
  fileInfoContainer: {
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  fileDetails: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 12,
  },
  summaryList: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryKey: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#4B5563',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#005CE6',
  },
  noticeBanner: {
    flexDirection: 'row',
    backgroundColor: '#F3F8FE',
    borderWidth: 1,
    borderColor: '#EAF1FC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#1E3A8A',
    marginLeft: 10,
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: '#005CE6',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#005CE6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});
