import { IconSymbol } from '@/components/ui/icon-symbol';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function Onboarding3() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.replace('/login' as any);
  };

  const handleSkip = () => {
    router.replace('/login' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header with Skip Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* Illustration */}
        <Image
          source={require('@/assets/images/secure-momo-img.png')}
          style={styles.illustration}
          contentFit="contain"
        />

        {/* Title */}
        <Text style={styles.title}>
          Secure Mobile{'\n'}
          <Text style={styles.highlightText}>Money Payments</Text>
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Pay quickly and securely using Mobile Money before collecting your prints.
        </Text>
      </View>

      {/* Bottom Controls Area */}
      <View style={styles.bottomControls}>
        {/* Pagination Indicators */}
        <View style={styles.pagination}>
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotInactive]} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        {/* Get Started Button */}
        <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.8} style={styles.getStartedButton}>
          <Text style={styles.getStartedButtonText}>Get Started</Text>
          <IconSymbol name="arrow.right" size={20} color="#ffffff" style={styles.nextArrow} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#4E5D78',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: -height * 0.02,
  },
  illustration: {
    width: width * 0.85,
    height: height * 0.35,
    maxHeight: 300,
    marginBottom: height * 0.04,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 16,
  },
  highlightText: {
    color: '#005CE6', // PrintEase brand blue
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    color: '#4E5D78',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  bottomControls: {
    paddingHorizontal: 24,
    paddingBottom: height * 0.05,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.04,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 5,
  },
  dotActive: {
    backgroundColor: '#005CE6',
  },
  dotInactive: {
    backgroundColor: '#D6E4F8',
  },
  getStartedButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#005CE6',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#005CE6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  getStartedButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  nextArrow: {
    position: 'absolute',
    right: 24,
  },
});
