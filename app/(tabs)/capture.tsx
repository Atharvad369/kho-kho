import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useAppSettings } from '@/context/AppSettingsContext';
import OpenCVValidator from '@/components/opencv';
import { Asset } from 'expo-asset';

export default function CaptureScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [templateUri, setTemplateUri] = useState<string | null>(null);
  const { colors, t } = useAppSettings();

  React.useEffect(() => {
    // Pre-load the template image URI
    (async () => {
      try {
        const asset = Asset.fromModule(require('@/assets/images/template.png'));
        await asset.downloadAsync();
        setTemplateUri(asset.localUri || asset.uri);
      } catch (e) {
        console.error("Failed to load template image", e);
      }
    })();
  }, []);

  const pickImage = async (source: 'camera' | 'gallery') => {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t.permissionNeeded, t.cameraPermission);
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t.permissionNeeded, t.galleryPermission);
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
    }

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const processImage = async () => {
    if (!selectedImage || !templateUri) {
      if (!templateUri) Alert.alert("Error", "Template image not loaded yet.");
      return;
    }
    // Start the OpenCV validation process instead of jumping straight to OCR
    setIsValidating(true);
  };

  const handleValidationComplete = (isValid: boolean, details: any) => {
    console.log('=== OPENCV VALIDATION RESULT ===');
    console.log('Is Valid:', isValid);
    console.log('Details:', JSON.stringify(details, null, 2));
    console.log('================================');
    setIsValidating(false);
    if (isValid) {
      // Good scoresheet! Proceed to OCR
      router.push({ pathname: '/ocr-result', params: { imageUri: selectedImage } });
      setSelectedImage(null);
    } else {
      // Bad structure
      Alert.alert(
        "Invalid Scoresheet",
        details?.message || "The captured image does not match the structure of a valid Kho-Kho scoresheet. Please take a clearer photo.",
        [{ text: "Try Again" }]
      );
    }
  };

  const handleValidationError = (errorMsg: string) => {
    console.error('=== OPENCV VALIDATION ERROR ===');
    console.error('Error:', errorMsg);
    console.error('===============================');
    setIsValidating(false);
    Alert.alert("Validation Error", errorMsg);
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + webTopInset + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t.captureScoresheet}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.takePhotoOrGallery}</Text>

        {selectedImage ? (
          <View style={styles.previewContainer}>
            <View style={[styles.imageWrapper, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
                contentFit="contain"
              />
              <Pressable
                style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.7 }]}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close" size={18} color={colors.white} />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.processButton,
                pressed && { opacity: 0.9 },
                isProcessing && { opacity: 0.7 },
              ]}
              onPress={processImage}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.processGradient}
              >
                {isProcessing ? (
                  <>
                    <ActivityIndicator color={colors.white} size="small" />
                    <Text style={[styles.processText, { color: colors.white }]}>{t.processing}</Text>
                  </>
                ) : (
                  <>
                    <Feather name="zap" size={18} color={colors.white} />
                    <Text style={[styles.processText, { color: colors.white }]}>{t.extractData}</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={styles.optionsContainer}>
            <Pressable
              style={({ pressed }) => [styles.optionCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }, pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
              onPress={() => pickImage('camera')}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="camera" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.optionTitle, { color: colors.text }]}>{t.takePhoto}</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{t.takePhotoDesc}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.optionCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }, pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
              onPress={() => pickImage('gallery')}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: colors.accent + '25' }]}>
                <Ionicons name="images" size={36} color={colors.accentDark} />
              </View>
              <Text style={[styles.optionTitle, { color: colors.text }]}>{t.fromGallery}</Text>
              <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{t.fromGalleryDesc}</Text>
            </Pressable>
          </View>
        )}

        {isValidating && selectedImage && templateUri && (
          <View style={StyleSheet.absoluteFillObject}>
            <OpenCVValidator
              imageUri={selectedImage}
              referenceUri={templateUri}
              onValidationComplete={handleValidationComplete}
              onError={handleValidationError}
            />
          </View>
        )}

        <View style={[styles.tipsCard, { backgroundColor: colors.accent + '20' }]}>
          <Ionicons name="bulb-outline" size={18} color={colors.accentDark} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipsTitle, { color: colors.text }]}>{t.tipsTitle}</Text>
            <Text style={[styles.tipsText, { color: colors.textSecondary }]}>{t.tipsText}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    marginTop: 4,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  optionCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  optionIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  optionTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
  },
  optionDesc: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    gap: 16,
    marginBottom: 24,
  },
  imageWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: 400,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  removeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  processGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 28,
  },
  processText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
  tipsCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 100,
  },
  tipsTitle: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
  tipsText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
    lineHeight: 18,
  },
});
