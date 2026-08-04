import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { searchGhanaLocations, LocationSearchResult } from '@/services/locationService';

export default function SignUpScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [defaultLocation, setDefaultLocation] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
  const [liveSuggestions, setLiveSuggestions] = useState<LocationSearchResult[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  React.useEffect(() => {
    if (defaultLocation.trim().length >= 2 && !selectedLocation) {
      setIsSearchingLocation(true);
      const timer = setTimeout(async () => {
        const results = await searchGhanaLocations(defaultLocation);
        setLiveSuggestions(results);
        setIsSearchingLocation(false);
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setLiveSuggestions([]);
      setIsSearchingLocation(false);
    }
  }, [defaultLocation, selectedLocation]);

  const handleSelectLocation = (loc: LocationSearchResult) => {
    setSelectedLocation(loc);
    setDefaultLocation(loc.name + (loc.district ? `, ${loc.district}` : ''));
    setShowSuggestions(false);
  };

  const handleBack = () => {
    router.back();
  };

  const handleLogin = () => {
    router.replace('/login' as any);
  };

  const { register, isLoading } = useAuthStore();

  const handleSignUp = async () => {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      await register({
        fullname: fullName,
        email: email,
        phoneNumber: phone,
        password: password,
        defaultLocationName: selectedLocation ? selectedLocation.name : undefined,
        defaultLatitude: selectedLocation ? selectedLocation.latitude : undefined,
        defaultLongitude: selectedLocation ? selectedLocation.longitude : undefined,
      });
      router.replace('/(tabs)' as any);
    } catch (e) {
      Alert.alert('Sign Up Failed', useAuthStore.getState().error || 'Could not register user');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Top Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo-img.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>

          {/* Header Text */}
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>Sign up to start printing with ease.</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputContainer}>
                <Feather name="user" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Feather name="mail" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputContainer}>
                <Feather name="phone" size={20} color="#9CA3AF" style={styles.inputIcon} />

                {/* Country Code Prefix */}
                <TouchableOpacity style={styles.countryCodeContainer}>
                  <Text style={styles.countryCodeText}>+233</Text>
                  <Feather name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
                <View style={styles.verticalDivider} />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Feather name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              {/* Password Hint */}
              <View style={styles.passwordHintContainer}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#005CE6" />
                <Text style={styles.passwordHintText}>
                  Use 8+ characters with a mix of letters, numbers & symbols
                </Text>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Feather name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Default Location */}
            <View style={[styles.inputGroup, { zIndex: 10 }]}>
              <Text style={styles.inputLabel}>Default Location (Optional)</Text>
              <View style={styles.inputContainer}>
                <Feather name="map-pin" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Unity Hall, KNUST"
                  placeholderTextColor="#9CA3AF"
                  value={defaultLocation}
                  onChangeText={(text) => {
                    setDefaultLocation(text);
                    setSelectedLocation(null);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                {isSearchingLocation && (
                  <ActivityIndicator size="small" color="#005CE6" style={{ marginRight: 12 }} />
                )}
              </View>

              {/* Suggestions Dropdown */}
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

            {/* Sign Up Button */}
            <TouchableOpacity 
              onPress={handleSignUp} 
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]} 
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

          </View>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.footerLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 150,
    height: 150,
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 56,
    backgroundColor: '#ffffff',
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    color: '#111827',
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  countryCodeText: {
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
    color: '#111827',
    marginRight: 4,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginRight: 12,
  },
  eyeIcon: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
  },
  passwordHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  passwordHintText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
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
    maxHeight: 200,
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    zIndex: 100,
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
  primaryButton: {
    backgroundColor: '#005CE6',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#6B9EE6',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#111827',
  },
  footerLink: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#005CE6',
  },
});
