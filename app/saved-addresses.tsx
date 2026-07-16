import { authService } from '@/services/authService';
import { LocationSearchResult, searchGhanaLocations } from '@/services/locationService';
import { useAuthStore } from '@/store/useAuthStore';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SavedAddressesScreen() {
  const router = useRouter();
  const { user_id, defaultLocationName, defaultLatitude, defaultLongitude, setDefaultLocation } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
  
  const [liveSuggestions, setLiveSuggestions] = useState<LocationSearchResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  React.useEffect(() => {
    if (searchQuery.trim().length >= 2 && !selectedLocation) {
      setIsSearchingLocation(true);
      const timer = setTimeout(async () => {
        const results = await searchGhanaLocations(searchQuery);
        setLiveSuggestions(results);
        setIsSearchingLocation(false);
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setLiveSuggestions([]);
      setIsSearchingLocation(false);
    }
  }, [searchQuery, selectedLocation]);

  const handleSelectLocation = (loc: LocationSearchResult) => {
    setSelectedLocation(loc);
    setSearchQuery(loc.name + (loc.district ? `, ${loc.district}` : ''));
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (!user_id) return;
    if (!selectedLocation) {
      Alert.alert("Error", "Please search and select a valid location from the dropdown.");
      return;
    }

    setSaving(true);
    try {
      await authService.updateDefaultLocation(
        user_id,
        selectedLocation.name,
        selectedLocation.latitude,
        selectedLocation.longitude
      );
      await setDefaultLocation(selectedLocation.name, selectedLocation.latitude, selectedLocation.longitude);
      
      Alert.alert("Success", "Default address updated successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Failed to update location", error);
      Alert.alert("Error", "Failed to update default address.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.currentAddressCard}>
            <View style={styles.iconContainer}>
              <Feather name="map-pin" size={24} color="#005CE6" />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>Current Default Address</Text>
              <Text style={styles.addressValue}>
                {defaultLocationName || 'No default address set'}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Update Default Address</Text>
          <Text style={styles.sectionSubtitle}>
            This address will be used to automatically sort print shops nearby when your device GPS is disabled.
          </Text>

          <View style={[styles.inputGroup, { zIndex: 10 }]}>
            <Text style={styles.inputLabel}>Search New Location</Text>
            <View style={styles.inputContainer}>
              <Feather name="search" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Unity Hall, KNUST"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setSelectedLocation(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              {isSearchingLocation && (
                <ActivityIndicator size="small" color="#005CE6" style={{ marginRight: 12 }} />
              )}
            </View>

            {showSuggestions && liveSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {liveSuggestions.map((loc, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectLocation(loc)}
                  >
                    <Feather name="map-pin" size={16} color="#6B7280" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionName} numberOfLines={1}>{loc.name}</Text>
                      <Text style={styles.suggestionDistrict} numberOfLines={1}>{loc.district}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, (!selectedLocation || saving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!selectedLocation || saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Address</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  currentAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  addressValue: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 56,
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#111827',
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionName: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#111827',
  },
  suggestionDistrict: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#005CE6',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});
