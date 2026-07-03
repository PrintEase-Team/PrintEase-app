import api from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MenuRowProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  isLast?: boolean;
  onPress?: () => void;
}

const MenuRow = ({ icon, title, isLast = false, onPress }: MenuRowProps) => {
  return (
    <View>
      <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={onPress}>
        <View style={styles.menuRowLeft}>
          <Feather name={icon} size={20} color="#4B5563" />
          <Text style={styles.menuTitle}>{title}</Text>
        </View>
        <Feather name="chevron-right" size={20} color="#9CA3AF" />
      </TouchableOpacity>
      {!isLast && <View style={styles.separator} />}
    </View>
  );
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user_id } = useAuthStore();
  const [userProfile, setUserProfile] = useState<any>({
    name: 'Loading...',
    phone_number: '...',
    email: '...',
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (user_id) {
        try {
          const res = await api.get(`/users/${user_id}`);
          if (res.data) setUserProfile(res.data);
        } catch (e) {
          console.error("Failed to fetch user profile", e);
        }
      }
    };
    fetchUser();
  }, [user_id]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <TouchableOpacity style={styles.profileCard} activeOpacity={0.8} onPress={() => router.push('/personal-info')}>
          <View style={styles.avatarContainer}>
            <Feather name="user" size={32} color="#005CE6" />
          </View>
          <View style={styles.profileInfo}>
            {userProfile.full_name || userProfile.name ? <Text style={styles.profileName}>{userProfile.full_name || userProfile.name}</Text> : null}
            {userProfile.phone_number ? <Text style={styles.profilePhone}>{userProfile.phone_number}</Text> : null}
            <Text style={styles.profileEmail}>{userProfile.email}</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Account Section */}
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.cardContainer}>
          <MenuRow icon="user" title="Personal Information" onPress={() => router.push('/personal-info')} />
          <MenuRow icon="map-pin" title="Saved Addresses" onPress={() => router.push('/saved-addresses')} />
          <MenuRow icon="shield" title="Security" isLast />
        </View>

        {/* Support & More Section */}
        <Text style={styles.sectionHeader}>Support & More</Text>
        <View style={styles.cardContainer}>
          <MenuRow icon="help-circle" title="Help & Support" />
          <MenuRow icon="info" title="About PrintEase" />
          <MenuRow icon="file-text" title="Terms & Conditions" />
          <MenuRow icon="lock" title="Privacy Policy" isLast />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.7}
          onPress={async () => {
            await useAuthStore.getState().logout();
            router.replace('/login');
          }}
        >
          <Feather name="log-out" size={20} color="#EF4444" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Match notifications screen background
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FAFAFA',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 8,
  },
  profileCard: {
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
    elevation: 2,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5F0FF', // Light blue background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#4B5563',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#4B5563',
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
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: '#111827',
    marginLeft: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#FEE2E2', // Light red border
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#EF4444',
  },
});
