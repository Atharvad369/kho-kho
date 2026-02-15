import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppSettings } from '@/context/AppSettingsContext';
import themes, { ThemeKey, themeNames } from '@/constants/colors';
import { LanguageKey, languageNames } from '@/lib/i18n';

const themeOptions: { key: ThemeKey; preview: [string, string, string] }[] = [
  { key: 'mintSage', preview: ['#3B9B6E', '#E0F2E9', '#F5D76E'] },
  { key: 'oceanBlue', preview: ['#3B7DD8', '#E0EDFA', '#64D2FF'] },
  { key: 'sunsetWarm', preview: ['#D4764E', '#FAEAE2', '#F2C94C'] },
];

const languageOptions: LanguageKey[] = ['en', 'hi', 'mr'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const { colors, themeKey, setThemeKey, languageKey, setLanguageKey, t } = useAppSettings();

  const handleThemeChange = (key: ThemeKey) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setThemeKey(key);
  };

  const handleLanguageChange = (key: LanguageKey) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLanguageKey(key);
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.text }]}>{t.settings}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.themeSettings}</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>{t.selectTheme}</Text>

          <View style={styles.themeGrid}>
            {themeOptions.map(opt => {
              const isSelected = themeKey === opt.key;
              const th = themes[opt.key];
              return (
                <Pressable
                  key={opt.key}
                  style={({ pressed }) => [
                    styles.themeCard,
                    { backgroundColor: th.backgroundGradientStart, borderColor: isSelected ? th.primary : th.border },
                    isSelected && { borderWidth: 2.5 },
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => handleThemeChange(opt.key)}
                >
                  <View style={styles.themePreview}>
                    {opt.preview.map((c, i) => (
                      <View key={i} style={[styles.themePreviewDot, { backgroundColor: c }]} />
                    ))}
                  </View>
                  <Text style={[styles.themeName, { color: th.text }]} numberOfLines={1}>{themeNames[opt.key]}</Text>
                  {isSelected && (
                    <View style={[styles.themeCheck, { backgroundColor: th.primary }]}>
                      <Ionicons name="checkmark" size={12} color={colors.white} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="language-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.languageSettings}</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>{t.selectLanguage}</Text>

          {languageOptions.map(key => {
            const isSelected = languageKey === key;
            return (
              <Pressable
                key={key}
                style={({ pressed }) => [
                  styles.langOption,
                  { backgroundColor: isSelected ? colors.primaryLight : colors.inputBg, borderColor: isSelected ? colors.primary : colors.border },
                  isSelected && { borderWidth: 1.5 },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => handleLanguageChange(key)}
              >
                <Text style={[styles.langName, { color: colors.text }]}>{languageNames[key]}</Text>
                {isSelected && (
                  <View style={[styles.langCheck, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.watermarkPreview, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.watermarkTitle, { color: colors.text }]}>{t.aboutExports}</Text>
            <Text style={[styles.watermarkDesc, { color: colors.textSecondary }]}>{t.aboutExportsText}</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
  },
  scrollContent: { paddingHorizontal: 20 },
  sectionCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
  },
  sectionDesc: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    marginBottom: 16,
    marginLeft: 30,
  },
  themeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  themeCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  themePreview: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  themePreviewDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  themeName: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
  },
  themeCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langOption: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  langName: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
  },
  langCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watermarkPreview: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  watermarkTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
  },
  watermarkDesc: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    marginTop: 4,
    lineHeight: 18,
  },
});
