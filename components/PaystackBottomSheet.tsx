import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
const WebViewComponent = WebView as any;
import Feather from '@expo/vector-icons/Feather';

interface PaystackBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (reference: string) => void;
  amount: number; // in GHS
  email: string;
}

export default function PaystackBottomSheet({
  visible,
  onClose,
  onSuccess,
  amount,
  email,
}: PaystackBottomSheetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  // Paystack expects amount in smallest currency unit (pesewas for GHS)
  const amountInPesewas = Math.round(amount * 100);
  const paystackKey = "pk_test_fc9b29dd5dcf28a34c9d07a904d4ae06d57576d1";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          body { margin: 0; padding: 0; background-color: #ffffff; height: 100vh; display: flex; justify-content: center; align-items: center; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #005CE6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loader" id="loader"></div>
        <script src="https://js.paystack.co/v2/inline.js"></script>
        <script type="text/javascript">
          function payWithPaystack(){
            var paystack = new PaystackPop();
            paystack.newTransaction({ 
              key: '${paystackKey}',
              email: '${email}',
              amount: ${amountInPesewas}, 
              currency: 'GHS',
              channels: ['card', 'mobile_money', 'bank'],
              onLoad: function() {
                 document.getElementById('loader').style.display = 'none';
              },
              onSuccess: function(response){
                var resp = {event:'successful', transactionRef:response};
                window.ReactNativeWebView.postMessage(JSON.stringify(resp));
              },
              onCancel: function(){
                var resp = {event:'cancelled'};
                window.ReactNativeWebView.postMessage(JSON.stringify(resp));
              }
            });
          }
          // Delay slightly to ensure bridge is ready
          setTimeout(payWithPaystack, 500);
        </script> 
      </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === 'successful') {
        onSuccess(data.transactionRef.reference || data.transactionRef.trans || 'test_ref');
      } else if (data.event === 'cancelled') {
        onClose();
      }
    } catch (e) {
      console.error('Error parsing paystack message:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.sheetContainer}>
          {/* Top Drag Indicator */}
          <View style={styles.dragIndicatorContainer}>
            <View style={styles.dragIndicator} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#111827" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Complete Payment</Text>
              <View style={styles.secureContainer}>
                <Feather name="lock" size={12} color="#10B981" />
                <Text style={styles.secureText}>Secured by Paystack</Text>
              </View>
            </View>
            
            <View style={{ width: 24 }} />
          </View>

          {/* WebView Container */}
          <View style={styles.webviewContainer}>
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#005CE6" />
              </View>
            )}
            <WebViewComponent
              ref={webViewRef}
              source={{ html: htmlContent }}
              style={styles.webview}
              onMessage={handleMessage}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              bounces={false}
              showsVerticalScrollIndicator={false}
              javaScriptEnabled={true}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    height: '85%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#111827',
  },
  secureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  secureText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
  },
  urlBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    borderRadius: 8,
  },
  urlText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#374151',
    marginLeft: 6,
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});
