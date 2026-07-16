import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { printSettingsService } from '@/services/printSettingsService';
import api from '@/services/api';
import { useOrderStore } from '@/store/useOrderStore';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrintSettingsScreen() {
  const router = useRouter();

  const [copies, setCopies] = useState(1);
  const [colorMode, setColorMode] = useState('bw'); // 'bw' | 'color'
  const [pages, setPages] = useState('all'); // 'all' | 'custom'
  const [startPage, setStartPage] = useState('1');
  const [endPage, setEndPage] = useState('');
  const [paperSize, setPaperSize] = useState('a4'); // 'a4' | 'a3' | 'letter'
  const [orientation, setOrientation] = useState('portrait'); // 'portrait' | 'landscape'
  const [doubleSided, setDoubleSided] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [shopPricing, setShopPricing] = useState({ 
    a4_bw: 0.5, a4_color: 1.0,
    a3_bw: 1.0, a3_color: 2.0,
    letter_bw: 0.6, letter_color: 1.2,
    supports_a4: true, supports_a3: false, supports_letter: false,
    supports_binding: false, binding_pricing: [] as any[],
    supports_lamination: false, 
    price_lamination_a4: 5.0, price_lamination_a3: 8.0, price_lamination_letter: 5.0
  });
  const [fileDetails, setFileDetails] = useState({ name: 'Document.pdf', sizeKb: 0, type: 'PDF' });
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(true);
  const [bindingSelected, setBindingSelected] = useState(false);
  const [laminationSelected, setLaminationSelected] = useState(false);
  
  const { currentOrderId, currentFileId, filePageCount, selectedShopId, setTotalAmount } = useOrderStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        if (selectedShopId) {
          const shopRes = await api.get(`/shops/${selectedShopId}`);
          if (shopRes.data) {
            setShopPricing({
              a4_bw: shopRes.data.price_a4_bw ?? 0.5,
              a4_color: shopRes.data.price_a4_color ?? 1.0,
              a3_bw: shopRes.data.price_a3_bw ?? 1.0,
              a3_color: shopRes.data.price_a3_color ?? 2.0,
              letter_bw: shopRes.data.price_letter_bw ?? 0.6,
              letter_color: shopRes.data.price_letter_color ?? 1.2,
              supports_a4: shopRes.data.supports_a4 !== false,
              supports_a3: shopRes.data.supports_a3 === true,
              supports_letter: shopRes.data.supports_letter === true,
              supports_binding: shopRes.data.supports_binding === true,
              binding_pricing: shopRes.data.binding_pricing ? JSON.parse(shopRes.data.binding_pricing) : [],
              supports_lamination: shopRes.data.supports_lamination === true,
              price_lamination_a4: shopRes.data.price_lamination_a4 ?? 5.0,
              price_lamination_a3: shopRes.data.price_lamination_a3 ?? 8.0,
              price_lamination_letter: shopRes.data.price_lamination_letter ?? 5.0,
            });
            
            // Set default paper size to the first supported one
            if (shopRes.data.supports_a4 !== false) setPaperSize('a4');
            else if (shopRes.data.supports_a3 === true) setPaperSize('a3');
            else if (shopRes.data.supports_letter === true) setPaperSize('letter');
          }
        }
        if (currentFileId) {
          const fileRes = await api.get(`/file/${currentFileId}`);
          if (fileRes.data) {
            setFileDetails({
              name: fileRes.data.file_name || 'Document.pdf',
              sizeKb: fileRes.data.file_size_kb || 0,
              type: fileRes.data.file_type || 'PDF'
            });
          }
        }
      } catch (e) {
        console.error("Error loading data", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedShopId, currentFileId]);

  const handleBack = () => {
    router.back();
  };

  const getPagesToPrint = () => {
    if (pages === 'all') return filePageCount;
    const start = parseInt(startPage) || 1;
    const end = parseInt(endPage) || filePageCount;
    if (start > end || start < 1 || end > filePageCount) return filePageCount;
    return (end - start) + 1;
  };

  const pagesToPrint = getPagesToPrint();
  const sheetsUsed = doubleSided ? Math.ceil(pagesToPrint / 2) : pagesToPrint;
  
  const bwPriceForCurrentPaper = paperSize === 'a3' ? shopPricing.a3_bw : paperSize === 'letter' ? shopPricing.letter_bw : shopPricing.a4_bw;
  const colorPriceForCurrentPaper = paperSize === 'a3' ? shopPricing.a3_color : paperSize === 'letter' ? shopPricing.letter_color : shopPricing.a4_color;
  
  const baseRate = colorMode === 'color' ? colorPriceForCurrentPaper : bwPriceForCurrentPaper;
  let totalCost = sheetsUsed * baseRate * copies;
  
  if (bindingSelected) {
    const totalSheetsPrinted = pagesToPrint * copies;
    // Find the right tier
    const matchingTier = shopPricing.binding_pricing.find((t: any) => totalSheetsPrinted >= t.min && totalSheetsPrinted <= t.max);
    if (matchingTier) {
      totalCost += matchingTier.price;
    } else if (shopPricing.binding_pricing.length > 0) {
      // Fallback to highest tier if over max
      const highestTier = shopPricing.binding_pricing.reduce((prev, current) => (prev.max > current.max) ? prev : current);
      totalCost += highestTier.price;
    }
  }
  if (laminationSelected) {
    const laminationPrice = paperSize === 'a3' ? shopPricing.price_lamination_a3 : paperSize === 'letter' ? shopPricing.price_lamination_letter : shopPricing.price_lamination_a4;
    totalCost += (laminationPrice * sheetsUsed * copies);
  }
  
  const savingsSheets = pagesToPrint - sheetsUsed;
  const savingsAmount = savingsSheets * baseRate * copies;

  const handleContinue = async () => {
    if (!currentOrderId || !currentFileId) {
      Alert.alert('Error', 'No order or file found. Please upload a file first.');
      return;
    }

    try {
      setIsSaving(true);
      // Build payload for print settings using expected names
      const printSettings = {
        order_id: currentOrderId,
        copies: copies,
        color_mode: colorMode === 'color' ? 'Colored' : 'Black_and_White',
        sided: doubleSided ? 'Double_sided' : 'Single_sided',
        page_range: pages === 'custom' ? `${startPage || 1}-${endPage || filePageCount}` : 'All',
        paper_size: paperSize,
        orientation: orientation,
        requires_binding: bindingSelected,
        requires_lamination: laminationSelected
      };

      await printSettingsService.createPrintSettings(printSettings);

      setTotalAmount(totalCost);
      router.push('/order-summary' as any);
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.message || 'Could not save print settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const incrementCopies = () => setCopies(c => c + 1);
  const decrementCopies = () => setCopies(c => (c > 1 ? c - 1 : 1));

  const formatMB = (kb: number) => (kb / 1024).toFixed(1) + ' MB';
  const getExt = (filename: string) => filename.split('.').pop()?.toUpperCase() || 'PDF';

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF'}}>
        <ActivityIndicator size="large" color="#005CE6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Print Settings</Text>
          <Text style={styles.headerSubtitle}>Step 2 of 4</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Top File Card */}
        <View style={styles.fileCard}>
          <View style={styles.fileIconContainer}>
            <Feather name="file-text" size={24} color="#FFFFFF" />
            <Text style={styles.fileIconText}>{getExt(fileDetails.name)}</Text>
          </View>
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>{fileDetails.name}</Text>
            <View style={styles.fileMetaRow}>
              <Text style={styles.fileMetaText}>{formatMB(fileDetails.sizeKb)}</Text>
              <View style={styles.dotSeparator} />
              <Text style={styles.fileMetaText}>{getExt(fileDetails.name)}</Text>
            </View>
            <View style={styles.pagesDetectedRow}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.pagesDetectedText}>{filePageCount} pages detected</Text>
            </View>
            <Text style={{fontSize: 12, fontFamily: 'Poppins-Regular', color: '#6B7280', marginTop: 4}}>
              GH¢{baseRate.toFixed(2)} × {sheetsUsed} sheets
            </Text>
          </View>
          <View style={styles.estimatedTotalBox}>
            <Text style={styles.estimatedTotalLabel}>Estimated Total</Text>
            <Text style={styles.estimatedTotalValue}>GH¢{totalCost.toFixed(2)}</Text>
          </View>
        </View>

        {/* Copies */}
        <View style={styles.rowSetting}>
          <View>
            <Text style={styles.sectionTitle}>Copies</Text>
            <Text style={styles.sectionSubtitleText}>Number of copies</Text>
          </View>
          <View style={styles.summaryContainer}>
            <TouchableOpacity onPress={decrementCopies} style={styles.counterButton} activeOpacity={0.7}>
              <Feather name="minus" size={18} color="#005CE6" />
            </TouchableOpacity>
            <View style={styles.counterValueContainer}>
              <Text style={styles.counterValue}>{copies}</Text>
            </View>
            <TouchableOpacity onPress={incrementCopies} style={styles.counterButton} activeOpacity={0.7}>
              <Feather name="plus" size={18} color="#005CE6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Color */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionCardDetailed, colorMode === 'bw' && styles.optionCardSelected]}
              onPress={() => setColorMode('bw')}
              activeOpacity={0.8}
            >
              <View style={styles.optionHeaderRow}>
                <Ionicons name={colorMode === 'bw' ? "radio-button-on" : "radio-button-off"} size={20} color={colorMode === 'bw' ? "#005CE6" : "#D1D5DB"} />
                <Ionicons name="document-text" size={20} color="#111827" style={{marginLeft: 8}} />
                <Text style={[styles.optionTextDetailed, colorMode === 'bw' && styles.optionTextSelected]}>Black & White</Text>
              </View>
              <Text style={styles.optionPriceText}>GH¢{bwPriceForCurrentPaper.toFixed(2)} / page</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionCardDetailed, colorMode === 'color' && styles.optionCardSelected, {marginLeft: 12}]}
              onPress={() => setColorMode('color')}
              activeOpacity={0.8}
            >
              <View style={styles.optionHeaderRow}>
                <Ionicons name={colorMode === 'color' ? "radio-button-on" : "radio-button-off"} size={20} color={colorMode === 'color' ? "#005CE6" : "#D1D5DB"} />
                <Ionicons name="color-palette" size={20} color="#F59E0B" style={{marginLeft: 8}} />
                <Text style={[styles.optionTextDetailed, colorMode === 'color' && styles.optionTextSelected]}>Color</Text>
              </View>
              <Text style={styles.optionPriceText}>GH¢{colorPriceForCurrentPaper.toFixed(2)} / page</Text>
            </TouchableOpacity>
          </View>
        </View>



        {/* Pages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pages</Text>
          <Text style={styles.pagesDetectedGreen}>{filePageCount} pages detected</Text>
          
          <View style={styles.stackedOptionsContainer}>
            <TouchableOpacity
              style={[styles.stackedOptionCard, pages === 'all' && styles.stackedOptionCardSelected]}
              onPress={() => setPages('all')}
              activeOpacity={0.8}
            >
              <Ionicons name={pages === 'all' ? "radio-button-on" : "radio-button-off"} size={20} color={pages === 'all' ? "#005CE6" : "#D1D5DB"} />
              <View style={{marginLeft: 12}}>
                <Text style={[styles.optionTextDetailed, pages === 'all' && styles.optionTextSelected]}>All Pages (1 - {filePageCount})</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.stackedOptionCard, pages === 'custom' && styles.stackedOptionCardSelected, {borderBottomWidth: 0}]}
              onPress={() => setPages('custom')}
              activeOpacity={0.8}
            >
              <Ionicons name={pages === 'custom' ? "radio-button-on" : "radio-button-off"} size={20} color={pages === 'custom' ? "#005CE6" : "#D1D5DB"} />
              <View style={{marginLeft: 12, flex: 1}}>
                <Text style={[styles.optionTextDetailed, pages === 'custom' && styles.optionTextSelected]}>Custom Range</Text>
                {pages === 'custom' ? (
                  <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
                    <TextInput
                      style={styles.pageInput}
                      placeholder="Start"
                      placeholderTextColor="#9CA3AF"
                      value={startPage}
                      onChangeText={setStartPage}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                    <Text style={{marginHorizontal: 8, color: '#9CA3AF'}}>-</Text>
                    <TextInput
                      style={styles.pageInput}
                      placeholder="End"
                      placeholderTextColor="#9CA3AF"
                      value={endPage}
                      onChangeText={setEndPage}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                ) : (
                  <Text style={styles.optionPriceText}>Select specific pages</Text>
                )}
              </View>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Paper Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paper Size</Text>
          <View style={styles.optionsRow}>
            {shopPricing.supports_a4 && (
              <TouchableOpacity
                style={[styles.optionCardDetailed, paperSize === 'a4' && styles.optionCardSelected, {flex: 1, padding: 12, marginRight: 8}]}
                onPress={() => setPaperSize('a4')}
                activeOpacity={0.8}
              >
                <View style={styles.optionHeaderRow}>
                  <Ionicons name={paperSize === 'a4' ? "radio-button-on" : "radio-button-off"} size={20} color={paperSize === 'a4' ? "#005CE6" : "#D1D5DB"} />
                  <Text style={[styles.optionTextDetailed, paperSize === 'a4' && styles.optionTextSelected, {marginLeft: 8}]}>A4</Text>
                </View>
                <Text style={[styles.optionPriceText, {marginLeft: 28}]}>210 × 297 mm</Text>
              </TouchableOpacity>
            )}
            
            {shopPricing.supports_a3 && (
              <TouchableOpacity
                style={[styles.optionCardDetailed, paperSize === 'a3' && styles.optionCardSelected, {flex: 1, padding: 12, marginRight: shopPricing.supports_letter ? 8 : 0}]}
                onPress={() => setPaperSize('a3')}
                activeOpacity={0.8}
              >
                <View style={styles.optionHeaderRow}>
                  <Ionicons name={paperSize === 'a3' ? "radio-button-on" : "radio-button-off"} size={20} color={paperSize === 'a3' ? "#005CE6" : "#D1D5DB"} />
                  <Text style={[styles.optionTextDetailed, paperSize === 'a3' && styles.optionTextSelected, {marginLeft: 8}]}>A3</Text>
                </View>
                <Text style={[styles.optionPriceText, {marginLeft: 28}]}>297 × 420 mm</Text>
              </TouchableOpacity>
            )}

            {shopPricing.supports_letter && (
              <TouchableOpacity
                style={[styles.optionCardDetailed, paperSize === 'letter' && styles.optionCardSelected, {flex: 1, padding: 12}]}
                onPress={() => setPaperSize('letter')}
                activeOpacity={0.8}
              >
                <View style={styles.optionHeaderRow}>
                  <Ionicons name={paperSize === 'letter' ? "radio-button-on" : "radio-button-off"} size={20} color={paperSize === 'letter' ? "#005CE6" : "#D1D5DB"} />
                  <Text style={[styles.optionTextDetailed, paperSize === 'letter' && styles.optionTextSelected, {marginLeft: 8}]}>Letter</Text>
                </View>
                <Text style={[styles.optionPriceText, {marginLeft: 28}]}>8.5 × 11 in</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Orientation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orientation</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionCardDetailed, orientation === 'portrait' && styles.optionCardSelected, {flex: 1, padding: 12, justifyContent: 'center'}]}
              onPress={() => setOrientation('portrait')}
              activeOpacity={0.8}
            >
              <View style={[styles.optionHeaderRow, {justifyContent: 'center'}]}>
                <Ionicons name="document-outline" size={20} color={orientation === 'portrait' ? "#005CE6" : "#6B7280"} />
                <Text style={[styles.optionTextDetailed, orientation === 'portrait' && styles.optionTextSelected, {marginLeft: 8}]}>Portrait</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionCardDetailed, orientation === 'landscape' && styles.optionCardSelected, {flex: 1, padding: 12, marginLeft: 12, justifyContent: 'center'}]}
              onPress={() => setOrientation('landscape')}
              activeOpacity={0.8}
            >
              <View style={[styles.optionHeaderRow, {justifyContent: 'center'}]}>
                <Ionicons name="videocam-outline" size={20} color={orientation === 'landscape' ? "#005CE6" : "#6B7280"} />
                <Text style={[styles.optionTextDetailed, orientation === 'landscape' && styles.optionTextSelected, {marginLeft: 8}]}>Landscape</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Double-sided Printing */}
        <View style={styles.section}>
          <View style={styles.rowSettingHeader}>
            <View>
              <Text style={styles.sectionTitle}>Double-sided Printing</Text>
              <Text style={styles.sectionSubtitleText}>Print on both sides of the paper</Text>
            </View>
            <Switch
              value={doubleSided}
              onValueChange={setDoubleSided}
              trackColor={{ false: '#E5E7EB', true: '#005CE6' }}
              thumbColor={'#FFFFFF'}
              ios_backgroundColor="#E5E7EB"
              style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
            />
          </View>
          {doubleSided && savingsAmount > 0 && (
            <View style={styles.savingsBadge}>
              <Ionicons name="leaf" size={14} color="#10B981" />
              <Text style={styles.savingsBadgeText}>You save GH¢{savingsAmount.toFixed(2)} with double-sided</Text>
            </View>
          )}
        </View>
        {/* Lamination */}
        {shopPricing.supports_lamination && (
          <View style={styles.section}>
            <View style={styles.rowSettingHeader}>
              <View>
                <Text style={styles.sectionTitle}>Lamination</Text>
                <Text style={styles.sectionSubtitleText}>Laminate each printed sheet</Text>
              </View>
              <Switch
                value={laminationSelected}
                onValueChange={setLaminationSelected}
                trackColor={{ false: '#E5E7EB', true: '#005CE6' }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor="#E5E7EB"
                style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
              />
            </View>
            {laminationSelected && (
              <View style={styles.savingsBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#005CE6" />
                <Text style={[styles.savingsBadgeText, { color: '#005CE6' }]}>
                  Adds GH¢{(paperSize === 'a3' ? shopPricing.price_lamination_a3 : paperSize === 'letter' ? shopPricing.price_lamination_letter : shopPricing.price_lamination_a4).toFixed(2)} per sheet
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Binding */}
        {shopPricing.supports_binding && (
          <View style={styles.section}>
            <View style={styles.rowSettingHeader}>
              <View>
                <Text style={styles.sectionTitle}>Comb Binding</Text>
                <Text style={styles.sectionSubtitleText}>Bind all printed sheets together</Text>
              </View>
              <Switch
                value={bindingSelected}
                onValueChange={setBindingSelected}
                trackColor={{ false: '#E5E7EB', true: '#005CE6' }}
                thumbColor={'#FFFFFF'}
                ios_backgroundColor="#E5E7EB"
                style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Footer */}
      <View style={styles.bottomFooter}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerTotalLabel}>Estimated Total</Text>
          <View style={styles.footerTotalRow}>
            <Text style={styles.footerTotalValue}>GH¢{totalCost.toFixed(2)}</Text>
            <Feather name="info" size={14} color="#9CA3AF" style={{marginLeft: 6}} />
          </View>
          <Text style={styles.footerTotalSub}>{pagesToPrint} pages • {copies} copies</Text>
        </View>
        <TouchableOpacity
          onPress={handleContinue}
          style={styles.continueButton}
          activeOpacity={0.8}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Feather name="chevron-right" size={20} color="#FFFFFF" style={{marginLeft: 4}} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 6,
    marginLeft: -6,
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
    color: '#005CE6',
    marginTop: -2,
  },
  headerSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  fileCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  fileIconContainer: {
    width: 48,
    height: 56,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fileIconText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    marginTop: 2,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  fileMetaText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 6,
  },
  pagesDetectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pagesDetectedText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#10B981',
    marginLeft: 4,
  },
  estimatedTotalBox: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
    paddingRight: 32,
    position: 'relative'
  },
  estimatedTotalLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    color: '#10B981',
  },
  estimatedTotalValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#065F46',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitleText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  rowSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rowSettingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  counterButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  counterValueContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  section: {
    marginBottom: 24,
  },
  optionsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  optionCardDetailed: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
  },
  optionCardSelected: {
    borderColor: '#005CE6',
    backgroundColor: '#F5F8FF',
  },
  optionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionTextDetailed: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#111827',
  },
  optionTextSelected: {
    color: '#005CE6',
    fontFamily: 'Poppins-Bold',
  },
  optionPriceText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginLeft: 28,
  },
  pagesDetectedGreen: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#10B981',
    marginBottom: 8,
  },
  stackedOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  stackedOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stackedOptionCardSelected: {
    backgroundColor: '#F5F8FF',
  },
  pageInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  savingsBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#10B981',
    marginLeft: 6,
  },
  finishingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  finishingTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  finishingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  finishingDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  footerLeft: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  footerTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerTotalValue: {
    fontSize: 22,
    fontWeight: '500',
    color: '#005CE6',
  },
  footerTotalSub: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    marginTop: 2,
  },
  continueButton: {
    backgroundColor: '#005CE6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#005CE6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
});
