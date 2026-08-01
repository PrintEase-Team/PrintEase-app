import { useOrderStore } from '@/store/useOrderStore';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useCallback } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import api, { API_BASE } from '@/services/api';

export default function OrderSummaryScreen() {
  const router = useRouter();

  const { currentOrderId, currentFileId, fileCosts, totalAmount, setCurrentFileId, removeFileCost, clearCurrentOrder, setFileCost, setTotalAmount } = useOrderStore();
  const [isLoading, setIsLoading] = useState(true);

  const [orderData, setOrderData] = useState({
    shopName: 'Loading...',
    shopLocation: '...',
    shopProfileUrl: null as string | null,
    queueTime: 'Calculating...',
    files: [] as any[],
    printSettings: [] as any[],
  });

  const fetchFullOrder = async () => {
    if (currentOrderId) {
      try {
        const response = await api.get(`/orders/${currentOrderId}/full`);
        const data = response.data;

        const getWaitTime = (estimatedReadyTime: string | null) => {
          if (!estimatedReadyTime) return '-- min';
          const now = new Date();
          const readyAt = new Date(estimatedReadyTime);
          const diffMs = readyAt.getTime() - now.getTime();
          if (diffMs <= 0) return 'Ready';
          return `${Math.ceil(diffMs / 60000)} min`;
        };

        const fetchedFiles = data.files || [];
        const fetchedSettings = data.printSettings || [];

        // Sync store costs with DB total_cost when available
        let calculatedTotal = 0;
        fetchedFiles.forEach((file: any) => {
          const setting = fetchedSettings.find((s: any) => s.file_id === file.file_id);
          if (setting && setting.total_cost != null) {
            setFileCost(file.file_id, setting.total_cost);
            calculatedTotal += setting.total_cost;
          } else if (fileCosts[file.file_id] != null) {
            calculatedTotal += fileCosts[file.file_id];
          }
        });
        setTotalAmount(calculatedTotal);

        setOrderData(prev => ({
          ...prev,
          shopName: data.order?.shop?.shop_name || 'My Print Shop',
          shopLocation: data.order?.shop?.location || '...',
          shopProfileUrl: data.order?.shop?.profile_picture_url || null,
          queueTime: getWaitTime(data.order?.estimated_ready_time),
          files: fetchedFiles,
          printSettings: fetchedSettings,
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

  useFocusEffect(
    useCallback(() => {
      fetchFullOrder();
    }, [currentOrderId])
  );

  const handleDeleteFile = (fileId: string) => {
    Alert.alert('Remove Document', 'Are you sure you want to remove this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await api.delete(`/file/${fileId}`);
            removeFileCost(fileId);
            
            if (currentOrderId) {
              const orderRes = await api.get(`/orders/${currentOrderId}/full`);
              if (orderRes.data && (!orderRes.data.files || orderRes.data.files.length === 0)) {
                await api.delete(`/orders/${currentOrderId}`);
                clearCurrentOrder();
                router.replace('/(tabs)' as any);
              } else {
                await fetchFullOrder();
              }
            } else {
              await fetchFullOrder();
            }
          } catch (e) {
            Alert.alert('Error', 'Could not remove document.');
            setIsLoading(false);
          }
        }
      }
    ]);
  };

  const handleEditFile = (file: any) => {
    if (file.file_id) {
      setCurrentFileId(file.file_id, file.page_count || 1);
      router.push('/print-settings' as any);
    }
  };

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
          {(() => {
            const hasOrphanedFiles = orderData?.files?.some((f: any) => !orderData.printSettings.find((s: any) => s.file_id === f.file_id));
            return (
              <>
                {/* Selected Print Shop Card */}
                <View style={styles.shopCard}>
                  <View style={styles.shopImageContainer}>
                    <Image
                      source={orderData.shopProfileUrl ? { uri: `${API_BASE}${orderData.shopProfileUrl}` } : require('@/assets/images/logo-img.png')}
                      style={styles.shopImage}
                      resizeMode={orderData.shopProfileUrl ? "cover" : "contain"}
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

                {/* Files Loop */}
                <Text style={styles.summaryTitle}>Cart Items</Text>
                <View style={styles.summaryList}>
                  {orderData.files.map((file: any) => {
                    const settings = orderData.printSettings.find((s: any) => s.file_id === file.file_id);
                    const isOrphaned = !settings;

                    return (
                      <View key={file.file_id} style={{ marginBottom: 20 }}>
                        <View style={[styles.fileCard, { marginBottom: 8 }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            {(() => {
                              const isImg = file.file_type?.startsWith('image/') || file.file_name?.match(/\.(jpg|jpeg|png|gif)$/i);
                              return (
                                <View style={[
                                  styles.pdfIconContainer,
                                  { backgroundColor: isImg ? '#DBEAFE' : '#FEE2E2' }
                                ]}>
                                  {isImg ? (
                                    <Feather name="image" size={20} color="#3B82F6" />
                                  ) : (
                                    <Feather name="file-text" size={20} color="#EF4444" />
                                  )}
                                </View>
                              );
                            })()}
                            <View style={styles.fileInfoContainer}>
                              <Text style={styles.fileName} numberOfLines={1}>{file.file_name}</Text>
                              <Text style={styles.fileDetails}>
                                {file.file_size_kb} KB • {file.page_count || 1} pages
                              </Text>
                              {isOrphaned ? (
                                <Text style={{ fontSize: 13, color: '#EF4444', fontFamily: 'Poppins-Bold', marginTop: 2 }}>
                                  ⚠️ Missing Print Settings
                                </Text>
                              ) : (
                                <Text style={{ fontSize: 13, color: '#005CE6', fontFamily: 'Poppins-Medium', marginTop: 2 }}>
                                  Cost: GHS {(settings?.total_cost ?? fileCosts[file.file_id] ?? 0).toFixed(2)}
                                </Text>
                              )}
                            </View>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity
                              style={{ padding: 8, marginRight: 4 }}
                              onPress={() => handleEditFile(file)}
                            >
                              <Feather name="edit-2" size={20} color="#005CE6" />
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={{ padding: 8 }}
                              onPress={() => handleDeleteFile(file.file_id)}
                            >
                              <Feather name="trash-2" size={20} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* File Settings Summary */}
                        {isOrphaned ? (
                          <View style={{ backgroundColor: '#FEE2E2', padding: 12, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' }}>
                            <Text style={{ color: '#EF4444', fontFamily: 'Poppins-Medium', fontSize: 13 }}>
                              This file is incomplete. Please delete it to proceed.
                            </Text>
                          </View>
                        ) : (
                          <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginHorizontal: 4 }}>
                            <View style={styles.summaryRow}>
                              <Text style={styles.summaryKey}>Copies</Text>
                              <Text style={styles.summaryValue}>{settings.copies || 1}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                              <Text style={styles.summaryKey}>Color</Text>
                              <Text style={styles.summaryValue}>{settings.color_mode ? settings.color_mode.replace('_', ' ') : 'B&W'}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                              <Text style={styles.summaryKey}>Sided</Text>
                              <Text style={styles.summaryValue}>{settings.sided && settings.sided.toLowerCase() === 'double_sided' ? 'Yes' : 'No'}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                              <Text style={styles.summaryKey}>Page Range</Text>
                              <Text style={styles.summaryValue}>{settings.page_range || 'All'}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                              <Text style={styles.summaryKey}>Paper Size</Text>
                              <Text style={styles.summaryValue}>{settings.paper_size ? settings.paper_size.toUpperCase() : 'A4'}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                              <Text style={styles.summaryKey}>Orientation</Text>
                              <Text style={styles.summaryValue}>{settings.orientation || 'Portrait'}</Text>
                            </View>
                            {settings.requires_binding && (
                              <View style={styles.summaryRow}>
                                <Text style={styles.summaryKey}>Binding</Text>
                                <Text style={styles.summaryValue}>Yes</Text>
                              </View>
                            )}
                            {settings.requires_lamination && (
                              <View style={styles.summaryRow}>
                                <Text style={styles.summaryKey}>Lamination</Text>
                                <Text style={styles.summaryValue}>Yes</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}

                  {/* Divider */}
                  <View style={styles.divider} />

                  {/* Total Amount */}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalAmount}>GHS {totalAmount ? totalAmount.toFixed(2) : '0.00'}</Text>
                  </View>
                </View>

                {/* Review Notice Banner */}
                <View style={styles.noticeBanner}>
                  <Ionicons name="information-circle" size={22} color="#005CE6" />
                  <Text style={styles.noticeText}>
                    Review your order details before proceeding to payment.
                  </Text>
                </View>

                {/* Add Another Document Button */}
                <TouchableOpacity
                  onPress={() => router.push('/upload-file' as any)}
                  style={[styles.continueButton, { backgroundColor: '#EAF1FC', marginBottom: 12 }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.continueButtonText, { color: '#005CE6' }]}>+ Add Another Document</Text>
                </TouchableOpacity>

                {/* Action Button */}
                <TouchableOpacity
                  onPress={hasOrphanedFiles ? () => Alert.alert('Incomplete Files', 'Please delete any incomplete files (⚠️) before proceeding.') : handleContinue}
                  style={[styles.continueButton, hasOrphanedFiles && { backgroundColor: '#9CA3AF' }]}
                  activeOpacity={hasOrphanedFiles ? 1 : 0.8}
                >
                  <Text style={styles.continueButtonText}>Proceed to Payment</Text>
                </TouchableOpacity>
              </>
            );
          })()}
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
    justifyContent: 'space-between',
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
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
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
