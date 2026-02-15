import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMatches } from '@/context/MatchContext';

function generateCSV(matches: any[], watermarkText: string): string {
  const border = '='.repeat(60);
  let csv = `${border}\n`;
  csv += `  ${watermarkText}\n`;
  csv += `  Export Date: ${new Date().toISOString().split('T')[0]}\n`;
  csv += `  Total Records: ${matches.length}\n`;
  csv += `${border}\n\n`;
  csv += 'Match ID,Date,Venue,Team A,Team A Score,Team B,Team B Score,Status,Auto-filled Fields\n';

  for (const m of matches) {
    const autoFilled = m.autoFilledFields.length > 0 ? m.autoFilledFields.join('; ') : 'None';
    csv += `"${m.id}","${m.date}","${m.venue}","${m.teamA.name}",${m.teamA.totalScore},"${m.teamB.name}",${m.teamB.totalScore},"${m.status}","${autoFilled}"\n`;
  }

  csv += `\n--- Player Details ---\n`;
  csv += 'Match Date,Team,Player Name,Player Score\n';

  for (const m of matches) {
    for (const p of m.teamA.players) {
      csv += `"${m.date}","${m.teamA.name}","${p.name}",${p.score}\n`;
    }
    for (const p of m.teamB.players) {
      csv += `"${m.date}","${m.teamB.name}","${p.name}",${p.score}\n`;
    }
  }

  csv += `\n${border}\n`;
  csv += `  ${watermarkText}\n`;
  csv += `${border}\n`;

  return csv;
}

export default function ExportScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const { matches, stats } = useMatches();
  const { colors, t } = useAppSettings();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type: 'all' | 'confirmed' | 'drafts') => {
    let data = matches;
    if (type === 'confirmed') data = matches.filter(m => m.status === 'confirmed');
    if (type === 'drafts') data = matches.filter(m => m.status === 'draft');

    if (data.length === 0) {
      Alert.alert(t.noData, t.noDataDesc);
      return;
    }

    setIsExporting(true);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const csv = generateCSV(data, t.watermarkText);
      const fileName = `khokho_scores_${type}_${Date.now()}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, csv, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: t.exportData,
          });
        } else {
          Alert.alert(t.exportComplete, `File saved as ${fileName}`);
        }
      }

      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Alert.alert(t.exportFailed, t.exportFailedDesc);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + webTopInset + 16, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>{t.exportData}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.shareRecords}</Text>

        <View style={[styles.summaryCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{stats.totalMatches}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.total}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{stats.confirmedMatches}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.confirmed}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{stats.draftMatches}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t.drafts}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.exportOptions}</Text>

        <Pressable
          style={({ pressed }) => [styles.exportCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }, pressed && { opacity: 0.92 }]}
          onPress={() => handleExport('all')}
          disabled={isExporting}
        >
          <View style={[styles.exportIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="download-outline" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.exportTitle, { color: colors.text }]}>{t.exportAll}</Text>
            <Text style={[styles.exportDesc, { color: colors.textSecondary }]}>{t.exportAllDesc}</Text>
          </View>
          {isExporting ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Feather name="chevron-right" size={20} color={colors.textTertiary} />
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.exportCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }, pressed && { opacity: 0.92 }]}
          onPress={() => handleExport('confirmed')}
          disabled={isExporting}
        >
          <View style={[styles.exportIcon, { backgroundColor: colors.positive + '15' }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.positive} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.exportTitle, { color: colors.text }]}>{t.confirmedOnly}</Text>
            <Text style={[styles.exportDesc, { color: colors.textSecondary }]}>{stats.confirmedMatches} {t.confirmed.toLowerCase()}</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textTertiary} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.exportCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }, pressed && { opacity: 0.92 }]}
          onPress={() => handleExport('drafts')}
          disabled={isExporting}
        >
          <View style={[styles.exportIcon, { backgroundColor: colors.accent + '20' }]}>
            <Ionicons name="create-outline" size={24} color={colors.accentDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.exportTitle, { color: colors.text }]}>{t.draftsOnly}</Text>
            <Text style={[styles.exportDesc, { color: colors.textSecondary }]}>{stats.draftMatches} {t.drafts.toLowerCase()}</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textTertiary} />
        </Pressable>

        <View style={[styles.watermarkBanner, { backgroundColor: colors.watermark }]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          <Text style={[styles.watermarkBannerText, { color: colors.primary }]}>{t.watermarkText}</Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>{t.aboutExports}</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{t.aboutExportsText}</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
    marginBottom: 24,
  },
  summaryCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 36,
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    marginBottom: 14,
  },
  exportCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  exportIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
  },
  exportDesc: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
  watermarkBanner: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  watermarkBannerText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
  infoCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  infoTitle: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
    lineHeight: 18,
  },
});
