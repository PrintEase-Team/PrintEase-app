import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

// Define the structure of a notification item
interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  isUnread: boolean;
  orderParams?: any;
}

interface NotificationSection {
  title: string;
  data: NotificationItem[];
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user_id } = useAuthStore();
  const [sections, setSections] = useState<NotificationSection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user_id) return;
    try {
      const response = await api.get(`/notifications/user/${user_id}`);
      const rawData = response.data;
      
      // Group by 'Recent' for now, or format dates properly
      const formattedData: NotificationItem[] = rawData.map((n: any) => ({
        id: n.notification_id,
        type: n.type,
        title: n.title,
        message: n.message,
        time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUnread: !n.is_read
      }));

      setSections([{ title: 'Recent Notifications', data: formattedData }]);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user_id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    // Toggle unread state to read
    if (item.isUnread) {
      try {
        await api.put(`/notifications/${item.id}/read`);
        setSections((prevSections) =>
          prevSections.map((section) => ({
            ...section,
            data: section.data.map((notification) =>
              notification.id === item.id
                ? { ...notification, isUnread: false }
                : notification
            ),
          }))
        );
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate to Order Details if order parameters are present
    if (item.orderParams) {
      router.push({
        pathname: '/order-details',
        params: item.orderParams,
      } as any);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user_id) return;
    try {
      await api.put(`/notifications/user/${user_id}/read-all`);
      setSections((prevSections) =>
        prevSections.map((section) => ({
          ...section,
          data: section.data.map((notification) => ({ ...notification, isUnread: false })),
        }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getIconConfig = (type: NotificationItem['type']) => {
    switch (type) {
      case 'payment_success':
        return {
          bgColor: '#10B981', // Solid Green
          icon: <Ionicons name="checkmark-sharp" size={20} color="#ffffff" />,
        };
      case 'printing_started':
        return {
          bgColor: '#005CE6', // Solid Blue
          icon: <Feather name="printer" size={18} color="#ffffff" />,
        };
      case 'queue_update':
        return {
          bgColor: '#005CE6', // Solid Blue
          icon: <Feather name="clock" size={18} color="#ffffff" />,
        };
      case 'pickup_ready':
        return {
          bgColor: '#F97316', // Solid Orange
          icon: <Feather name="bell" size={18} color="#ffffff" />,
        };
      case 'new_offer':
        return {
          bgColor: '#8B5CF6', // Solid Purple
          icon: <Ionicons name="megaphone" size={18} color="#ffffff" />,
        };
      case 'shop_update':
        return {
          bgColor: '#6B7280', // Solid Slate Grey
          icon: <Ionicons name="storefront" size={18} color="#ffffff" />,
        };
      case 'payment_failed':
        return {
          bgColor: '#EF4444', // Solid Red
          icon: <Feather name="alert-triangle" size={18} color="#ffffff" />,
        };
      default:
        return {
          bgColor: '#6B7280',
          icon: <Feather name="info" size={18} color="#ffffff" />,
        };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7} onPress={handleMarkAllAsRead}>
          <Ionicons name="checkmark-done" size={24} color="#005CE6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#005CE6" style={{ marginTop: 50 }} />
        ) : sections.length > 0 && sections[0].data.length > 0 ? (
          sections.map((section) => (
            <View key={section.title} style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>{section.title}</Text>

            <View style={styles.cardContainer}>
              {section.data.map((item, index) => {
                const iconConfig = getIconConfig(item.type);
                const isLast = index === section.data.length - 1;

                return (
                  <View key={item.id}>
                    <TouchableOpacity
                      onPress={() => handleNotificationPress(item)}
                      activeOpacity={0.7}
                      style={styles.notificationItem}
                    >
                      {/* Leading Colored Circle Icon */}
                      <View
                        style={[
                          styles.iconCircle,
                          { backgroundColor: iconConfig.bgColor },
                        ]}
                      >
                        {iconConfig.icon}
                      </View>

                      {/* Content Area */}
                      <View style={styles.textContainer}>
                        <View style={styles.titleRow}>
                          <Text style={styles.notificationTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.timeText}>{item.time}</Text>
                        </View>
                        <Text style={styles.messageText}>{item.message}</Text>
                      </View>

                      {/* Read/Unread Indicator */}
                      {item.isUnread && (
                        <View style={styles.unreadDotContainer}>
                          <View style={styles.unreadDot} />
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Thin separator line between notifications in the same group */}
                    {!isLast && <View style={styles.separator} />}
                  </View>
                );
              })}
            </View>
          </View>
        ))
        ) : (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <Ionicons name="notifications-off-outline" size={64} color="#9CA3AF" />
            <Text style={{ fontFamily: 'Poppins-Medium', fontSize: 16, color: '#4B5563', marginTop: 16 }}>No notifications yet</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Soft off-white to make the card panels pop
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
  settingsButton: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 12,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
  },
  messageText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#4B5563',
    lineHeight: 18,
  },
  unreadDotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#005CE6', // PrintEase brand blue
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
});
