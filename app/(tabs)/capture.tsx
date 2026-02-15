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
import Colors from '@/constants/colors';

export default function CaptureScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const pickImage = async (source: 'camera' | 'gallery') => {
    let result: ImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Gallery permission is required to select photos.');
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
    if (!selectedImage) return;
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    router.push({ pathname: '/ocr-result', params: { imageUri: selectedImage } });
    setSelectedImage(null);
  };

  return (
    <LinearGradient
      colors={[Colors.light.backgroundGradientStart, Colors.light.backgroundGradientEnd]}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + webTopInset + 16 }]}>
        <Text style={styles.title}>Capture Scoresheet</Text>
        <Text style={styles.subtitle}>Take a photo or select from gallery</Text>

        {selectedImage ? (
          <View style={styles.previewContainer}>
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
                contentFit="contain"
              />
              <Pressable
                style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.7 }]}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close" size={18} color={Colors.light.white} />
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
                colors={[Colors.light.primary, '#2D8A5E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.processGradient}
              >
                {isProcessing ? (
                  <>
                    <ActivityIndicator color={Colors.light.white} size="small" />
                    <Text style={styles.processText}>Processing...</Text>
                  </>
                ) : (
                  <>
                    <Feather name="zap" size={18} color={Colors.light.white} />
                    <Text style={styles.processText}>Extract Data</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={styles.optionsContainer}>
            <Pressable
              style={({ pressed }) => [styles.optionCard, pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
              onPress={() => pickImage('camera')}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: Colors.light.primary + '15' }]}>
                <Ionicons name="camera" size={36} color={Colors.light.primary} />
              </View>
              <Text style={styles.optionTitle}>Take Photo</Text>
              <Text style={styles.optionDesc}>Use your camera to capture the scoresheet</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.optionCard, pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
              onPress={() => pickImage('gallery')}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: Colors.light.accent + '25' }]}>
                <Ionicons name="images" size={36} color={Colors.light.accentDark} />
              </View>
              <Text style={styles.optionTitle}>From Gallery</Text>
              <Text style={styles.optionDesc}>Select an existing scoresheet photo</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.tipsCard}>
          <Ionicons name="bulb-outline" size={18} color={Colors.light.accentDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipsTitle}>Tips for best results</Text>
            <Text style={styles.tipsText}>
              Place the scoresheet on a flat surface with good lighting. Avoid shadows and glare. Ensure all text is visible.
            </Text>
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
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.light.cardShadow,
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
    color: Colors.light.text,
  },
  optionDesc: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
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
    backgroundColor: Colors.light.card,
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: 400,
    shadowColor: Colors.light.cardShadow,
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
    color: Colors.light.white,
  },
  tipsCard: {
    backgroundColor: Colors.light.accent + '20',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 100,
  },
  tipsTitle: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.text,
  },
  tipsText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
});
