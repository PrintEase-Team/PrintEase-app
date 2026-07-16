import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { fileService } from '@/services/fileService';
import { orderService } from '@/services/orderService';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrderStore } from '@/store/useOrderStore';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UploadFileScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const [isUploading, setIsUploading] = useState(false);
  const { user_id } = useAuthStore();
  const { setCurrentOrder, selectedShopId } = useOrderStore();

  const handleUploadPress = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      if (!user_id) {
        Alert.alert('Error', 'You must be logged in to upload files.');
        return;
      }

      setIsUploading(true);
      const fileAsset = result.assets[0];

      // 1. Create Order
      if (!selectedShopId) {
        Alert.alert('Error', 'No shop selected.');
        return;
      }
      const newOrder = await orderService.createOrder({ student_id: user_id, shop_id: selectedShopId });

      // 2. Upload File and link to the new Order
      const uploadedFile = await fileService.uploadFile(newOrder.order_id, user_id, {
        uri: fileAsset.uri,
        name: fileAsset.name,
        mimeType: fileAsset.mimeType || 'application/pdf',
      });

      // 3. Save order to Zustand
      setCurrentOrder(newOrder.order_id, uploadedFile.file_id, uploadedFile.page_count || 1);

      Alert.alert('Success', 'File uploaded successfully!');
      
      // Automatically go to Print Settings
      router.push('/print-settings' as any);
      
    } catch (e: any) {
      console.error(e);
      Alert.alert('Upload Failed', e.response?.data?.message || 'There was an error uploading the file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      if (!user_id) {
        Alert.alert('Error', 'You must be logged in to upload files.');
        return;
      }

      setIsUploading(true);
      const photo = result.assets[0];
      const fileName = photo.fileName || `photo_${Date.now()}.jpg`;

      // 1. Create a Pending Order
      if (!selectedShopId) {
        Alert.alert('Error', 'No shop selected.');
        return;
      }
      const newOrder = await orderService.createOrder({ student_id: user_id, shop_id: selectedShopId });

      // 2. Upload photo and link to the new Order
      const uploadedFile = await fileService.uploadFile(newOrder.order_id, user_id, {
        uri: photo.uri,
        name: fileName,
        mimeType: photo.mimeType || 'image/jpeg',
      });

      // 3. Save order to Zustand
      setCurrentOrder(newOrder.order_id, uploadedFile.file_id, uploadedFile.page_count || 1);

      Alert.alert('Success', 'Photo uploaded successfully!');
      router.push('/print-settings' as any);

    } catch (e: any) {
      console.error(e);
      Alert.alert('Upload Failed', e.response?.data?.message || 'There was an error uploading the photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleContinue = () => {
    router.push('/print-settings' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Upload File</Text>
          <Text style={styles.headerSubtitle}>Step 1 of 4</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Dashed Upload Area */}
        <TouchableOpacity
          onPress={handleUploadPress}
          activeOpacity={0.8}
          style={styles.uploadArea}
        >
          <Ionicons name="cloud-upload-outline" size={48} color="#005CE6" />
          <Text style={styles.uploadPrimaryText}>Drag & drop your file here</Text>
          <Text style={styles.uploadSecondaryText}>or</Text>

          {/* Styled Choose File Button */}
          <View style={styles.chooseFileButton}>
            {isUploading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.chooseFileButtonText}>Choose File</Text>
            )}
          </View>

          {/* Supported Formats */}
          <Text style={styles.supportedTitle}>Supported formats</Text>
          <Text style={styles.supportedText}>
            PDF, JPG, PNG
          </Text>
          <Text style={styles.supportedText}>
            (Max 50MB)
          </Text>
        </TouchableOpacity>

        {/* Integration Options Grid */}
        <View style={styles.gridContainer}>
          {/* Row 1 */}
          <View style={styles.gridRow}>
            {/* Google Drive */}
            <TouchableOpacity
              onPress={handleUploadPress}
              activeOpacity={0.7}
              style={styles.gridButton}
            >
              <MaterialCommunityIcons name="google-drive" size={22} color="#34A853" />
              <Text style={styles.gridButtonText}>Google Drive</Text>
            </TouchableOpacity>

            {/* Dropbox */}
            <TouchableOpacity
              onPress={handleUploadPress}
              activeOpacity={0.7}
              style={styles.gridButton}
            >
              <MaterialCommunityIcons name="dropbox" size={22} color="#0061FE" />
              <Text style={styles.gridButtonText}>Dropbox</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.gridRow}>
            {/* Take Photo */}
            <TouchableOpacity
              onPress={handleTakePhoto}
              activeOpacity={0.7}
              style={styles.gridButton}
            >
              <Ionicons name="camera-outline" size={22} color="#4B5563" />
              <Text style={styles.gridButtonText}>Take Photo</Text>
            </TouchableOpacity>

            {/* Browse Files */}
            <TouchableOpacity
              onPress={handleUploadPress}
              activeOpacity={0.7}
              style={styles.gridButton}
            >
              <Ionicons name="folder-outline" size={22} color="#005CE6" />
              <Text style={styles.gridButtonText}>Browse Files</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Info Banner */}
        <View style={styles.securityCard}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#005CE6" />
          <View style={styles.securityTextContainer}>
            <Text style={styles.securityText}>Your files are secure and</Text>
            <Text style={styles.securityText}>will be deleted after printing.</Text>
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleContinue}
          style={styles.continueButton}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
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
    width: 36, // balances the backButton width
  },
  scrollContent: {
    paddingBottom: 32,
  },
  uploadArea: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BFDBFE',
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginHorizontal: 24,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPrimaryText: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  uploadSecondaryText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginVertical: 8,
  },
  chooseFileButton: {
    backgroundColor: '#005CE6',
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
    shadowColor: '#005CE6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chooseFileButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  supportedTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: '#4B5563',
    marginTop: 20,
    marginBottom: 4,
  },
  supportedText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  gridContainer: {
    marginHorizontal: 24,
    marginTop: 20,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridButton: {
    flex: 1,
    marginHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  gridButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#111827',
    marginLeft: 10,
  },
  securityCard: {
    flexDirection: 'row',
    backgroundColor: '#F3F8FE',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 24,
    marginTop: 12,
    alignItems: 'center',
  },
  securityTextContainer: {
    marginLeft: 12,
  },
  securityText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#4E5D78',
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: '#005CE6',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 24,
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
