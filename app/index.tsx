import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const init = async () => {
      try {
        await useAuthStore.getState().hydrate();
      } catch (e) {
        console.error("Hydration error:", e);
      }
      
      timer = setTimeout(() => {
        const hasToken = useAuthStore.getState().token !== null;
        if (hasToken) {
          router.replace('/(tabs)' as any);
        } else {
          router.replace('/onboarding1' as any);
        }
      }, 2500);
    };

    init();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [router]);
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Main Logo Container */}
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/logo-img.png')}
          style={styles.logo}
          contentFit="contain"
          transition={200}
        />
      </View>

      {/* Wave Decoration Container */}
      <View style={styles.waveContainer} pointerEvents="none">
        {/* Wave Layer 1 (Back/Lightest) */}
        <View style={[styles.wave, styles.wave1]} />
        {/* Wave Layer 2 (Middle) */}
        <View style={[styles.wave, styles.wave2]} />
        {/* Wave Layer 3 (Front/Darkest) */}
        <View style={[styles.wave, styles.wave3]} />
      </View>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
    zIndex: 10,
    // Shift slightly upwards to balance the visual weight against the bottom waves
    marginTop: -height * 0.05,
  },
  logo: {
    width: width * 0.65,
    height: width * 0.65,
    maxWidth: 280,
    maxHeight: 280,
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
    width: '100%',
    overflow: 'hidden',
    zIndex: 1,
  },
  wave: {
    position: 'absolute',
    borderRadius: 1000,
  },
  // Wave 1 (Lightest blue background curve)
  wave1: {
    width: width * 2.2,
    height: width * 2.2,
    backgroundColor: '#F3F8FE',
    bottom: -width * 1.5,
    left: -width * 0.5,
  },
  // Wave 2 (Middle curve)
  wave2: {
    width: width * 2.2,
    height: width * 2.2,
    backgroundColor: '#EAF1FC',
    bottom: -width * 1.6,
    right: -width * 0.55,
  },
  // Wave 3 (Foreground curve)
  wave3: {
    width: width * 2.2,
    height: width * 2.2,
    backgroundColor: '#DCEBFC',
    bottom: -width * 1.7,
    left: -width * 0.6,
  },

});
