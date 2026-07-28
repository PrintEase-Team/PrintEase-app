import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define TS Types for clean state loading in future
interface Order {
  id: string;
  shopId: string;
  shopName: string;
  shopLocation: string;
  waitTime: string;
  documentName: string;
  pagesInfo: string;
  price: string;
  status: 'Active' | 'Printing' | 'Ready' | 'Completed' | 'Cancelled';
  date: string;
  fileType: 'pdf' | 'word';
  rawId?: number | string;
  pickupCode?: string;
}

// Removed mockOrders

export default function OrdersScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'All' | 'Active' | 'Completed'>('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user_id } = useAuthStore();

  useEffect(() => {
    fetchOrders();
    // Auto-poll every 10 seconds
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, [user_id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [user_id]);

  const getWaitTime = (estimatedReadyTime: string | null) => {
    if (!estimatedReadyTime) return 'Calculating...';
    const now = new Date();
    const readyAt = new Date(estimatedReadyTime);
    const diffMs = readyAt.getTime() - now.getTime();
    if (diffMs <= 0) return 'Ready';
    const diffMins = Math.ceil(diffMs / 60000);
    return `${diffMins} min`;
  };

  const fetchOrders = async () => {
    if (!user_id) return;
    try {
      const response = await api.get(`/orders/student/${user_id}`);
      const mappedOrders = response.data.map((o: any) => ({
        id: o.order_id?.substring(0,8).toUpperCase(),
        rawId: o.order_id,
        shopId: o.shop_id,
        shopName: o.shop_name || 'Unknown Shop',
        shopLocation: o.shop_location || 'Unknown Location',
        waitTime: getWaitTime(o.estimated_ready_time),
        documentName: o.document_name || 'Document',
        pagesInfo: `${o.page_count ? o.page_count + ' pages • ' : ''}${o.copies ? o.copies + ' copies • ' : ''}${o.color_mode === 'Colored' ? 'Color' : 'Black & White'} • ${o.sided === 'Double_sided' ? 'Double Sided' : 'Single Sided'}`,
        price: o.payment_amount != null ? `GHS ${Number(o.payment_amount).toFixed(2)}` : 'GHS --',
        status: o.status === 'Pending' ? 'Active' : (o.status === 'Collected' ? 'Completed' : o.status),
        date: o.submitted_at ? new Date(o.submitted_at).toLocaleString() : 'N/A',
        fileType: o.file_type || 'pdf',
        pickupCode: o.pickup_code
      }));
      setOrders(mappedOrders.reverse());
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  // Filter logic based on tab selected
  const filteredOrders = orders.filter((order) => {
    if (selectedTab === 'All') return true;
    if (selectedTab === 'Active') {
      return order.status === 'Active' || order.status === 'Printing' || order.status === 'Ready';
    }
    return order.status === selectedTab;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Active':
        return { bg: '#E8F2FF', text: '#005CE6' };
      case 'Printing':
        return { bg: '#FFF0E6', text: '#F97316' };
      case 'Ready':
        return { bg: '#EAFCEF', text: '#10B981' };
      case 'Collected':
      case 'Completed':
        return { bg: '#F3F4F6', text: '#6B7280' };
      case 'Cancelled':
        return { bg: '#FEE2E2', text: '#EF4444' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getWaitTimeColor = (waitTime: string) => {
    if (waitTime === '4 min') return '#10B981'; // Green
    if (waitTime === '10 min') return '#F59E0B'; // Orange/Yellow
    return '#EF4444'; // Red for 18 min
  };

  const handleOrderPress = (order: Order) => {
    // Navigate to Order Details, passing parameters
    router.push({
      pathname: '/order-details',
      params: {
        orderId: order.id,
        shopId: order.shopId,
        shopName: order.shopName,
        shopLocation: order.shopLocation,
        documentName: order.documentName,
        pagesInfo: order.pagesInfo,
        price: order.price,
        status: order.status,
        date: order.date,
        fileType: order.fileType,
        pickupCode: (order as any).pickupCode,
        rawId: order.rawId,
      },
    } as any);
  };

  // Renders the progress timeline line & nodes with gaps
  const renderTimeline = (order: Order) => {
    const status = order.status;
    if (status === 'Cancelled') return null;

    let activeStepIndex = 0; // 0: Placed, 1: Queued, 2: Printing, 3: Ready
    if (status === 'Active') {
      activeStepIndex = 1; // Queued
    } else if (status === 'Printing') {
      activeStepIndex = 2; // Printing
    } else if (status === 'Ready' || status === 'Completed') {
      activeStepIndex = 3; // Ready
    }

    const steps = ['Placed', 'Queued', 'Printing', 'Ready'];
    const dateStr = order.date ? order.date.split(',')[0] : 'N/A';

    const getSubText = (index: number, label: string) => {
      if (index < activeStepIndex) {
        return index === 0 ? dateStr : 'Done';
      } else if (index === activeStepIndex) {
        if (label === 'Placed') return dateStr;
        if (label === 'Ready') return 'Ready';
        return 'In progress';
      } else {
        return 'Pending';
      }
    };

    return (
      <View style={styles.timelineContainer}>
        <View style={styles.nodesRow}>
          {steps.map((label, index) => {
            const isCompleted = index < activeStepIndex;
            const isCurrent = index === activeStepIndex;
            const isDoneOrCurrent = index <= activeStepIndex;
            const isLineActive = index < activeStepIndex;
            const subText = getSubText(index, label);

            return (
              <React.Fragment key={label}>
                <View style={styles.nodeItem}>
                  {isDoneOrCurrent ? (
                    <View style={styles.nodeCircleBlue}>
                      <Ionicons name="checkmark" size={13} color="#ffffff" />
                    </View>
                  ) : (
                    <View style={styles.nodeCircleEmpty} />
                  )}
                  <Text
                    style={[
                      styles.nodeLabel,
                      isCurrent
                        ? styles.nodeLabelCurrent
                        : isCompleted
                        ? styles.nodeLabelCompleted
                        : styles.nodeLabelUpcoming,
                    ]}
                  >
                    {label}
                  </Text>
                  <Text
                    style={[
                      styles.nodeSubLabel,
                      isCurrent && { color: '#005CE6', fontFamily: 'Poppins-Medium' },
                    ]}
                    numberOfLines={1}
                  >
                    {subText}
                  </Text>
                </View>

                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.segmentLine,
                      { backgroundColor: isLineActive ? '#005CE6' : '#E2E8F0' },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Tabs/Chips */}
      <View style={styles.chipsContainer}>
        {['All', 'Active', 'Completed'].map((tab) => {
          const isSelected = selectedTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedTab(tab as any)}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Scrollable Orders List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005CE6']} tintColor="#005CE6" />
        }
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="shopping-bag" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No orders found in this section</Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const badgeStyle = getStatusBadgeStyle(order.status);
            const showTimeline = order.status !== 'Completed' && order.status !== 'Cancelled';

            return (
              <TouchableOpacity
                key={order.id}
                onPress={() => handleOrderPress(order)}
                style={styles.card}
                activeOpacity={0.9}
              >
                {/* Top Row: Badge, Order ID, Shop Name, Wait Time */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: badgeStyle.bg },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: badgeStyle.text }]}>
                        {order.status}
                      </Text>
                    </View>
                    <Text style={styles.orderId}>{order.id}</Text>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    <Text style={styles.shopName} numberOfLines={1}>
                      {order.shopName}
                    </Text>
                    {order.waitTime !== '0 min' && (
                      <Text
                        style={[
                          styles.waitTime,
                          { color: getWaitTimeColor(order.waitTime) },
                        ]}
                      >
                        {order.waitTime}
                      </Text>
                    )}
                    <Feather name="chevron-right" size={18} color="#9CA3AF" style={{ marginLeft: 4 }} />
                  </View>
                </View>

                {/* Middle Row: Doc Icon, Doc details, Total Price */}
                <View style={styles.documentRow}>
                  <View style={styles.docIconContainer}>
                    <View
                      style={[
                        styles.fileTypeBadge,
                        {
                          backgroundColor:
                            order.fileType === 'pdf' ? '#EF4444' : '#2563EB',
                        },
                      ]}
                    >
                      <Text style={styles.fileTypeText}>
                        {order.fileType === 'pdf' ? 'PDF' : 'W'}
                      </Text>
                    </View>
                    <View style={styles.docDetailsContainer}>
                      <Text style={styles.documentName} numberOfLines={1}>
                        {order.documentName}
                      </Text>
                      <Text style={styles.pagesInfo}>{order.pagesInfo}</Text>
                    </View>
                  </View>
                  <Text style={styles.price}>{order.price}</Text>
                </View>

                {/* Timeline Row */}
                {showTimeline && renderTimeline(order)}
              </TouchableOpacity>
            );
          })
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerSpacer: {
    width: 36,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  searchButton: {
    padding: 6,
    borderRadius: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: '#005CE6',
    borderColor: '#005CE6',
  },
  chipUnselected: {
    backgroundColor: '#ffffff',
    borderColor: '#E5E7EB',
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  chipTextUnselected: {
    color: '#4B5563',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#9CA3AF',
    marginTop: 12,
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
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
  orderId: {
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    color: '#4B5563',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  shopName: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginRight: 6,
    flexShrink: 1,
  },
  waitTime: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
  documentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  docIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  fileTypeBadge: {
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
  docDetailsContainer: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  pagesInfo: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  timelineContainer: {
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  nodesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  nodeItem: {
    alignItems: 'center',
    width: 54,
  },
  segmentLine: {
    flex: 1,
    height: 2,
    marginTop: 9,
    marginHorizontal: -2,
    borderRadius: 1,
  },
  nodeCircleBlue: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#005CE6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodeCircleEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#ffffff',
    zIndex: 2,
  },
  nodeLabel: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  nodeLabelCurrent: {
    fontFamily: 'Poppins-Bold',
    color: '#005CE6',
  },
  nodeLabelCompleted: {
    fontFamily: 'Poppins-Medium',
    color: '#475569',
  },
  nodeLabelUpcoming: {
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
  },
  nodeSubLabel: {
    fontSize: 9,
    fontFamily: 'Poppins-Regular',
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
});
