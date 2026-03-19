import React, { useMemo } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppSettings } from '@/context/AppSettingsContext';
import { simulateOCR } from '@/lib/match-storage';
import { ThemeColors } from '@/constants/colors';

function ConfidenceBadge({ value, colors }: { value: number; colors: ThemeColors }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 85 ? colors.confidenceHigh :
      pct >= 60 ? colors.confidenceMedium :
        colors.confidenceLow;

  return (
    <View style={[styles.confidenceBadge, { backgroundColor: color + '18' }]}>
      <View style={[styles.confidenceDot, { backgroundColor: color }]} />
      <Text style={[styles.confidenceText, { color }]}>{pct}%</Text>
    </View>
  );
}

function FieldRow({ label, value, confidence, isAutoFilled, colors, t }: {
  label: string;
  value: string;
  confidence: number;
  isAutoFilled?: boolean;
  colors: ThemeColors;
  t: any;
}) {
  return (
    <View style={[styles.fieldRow, { borderBottomColor: colors.border }]}>
      <View style={styles.fieldLeft}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.fieldValue, { color: colors.text }]}>{value}</Text>
      </View>
      <View style={styles.fieldRight}>
        <ConfidenceBadge value={confidence} colors={colors} />
        {isAutoFilled && (
          <View style={[styles.autoFillBadge, { backgroundColor: colors.accent + '25' }]}>
            <Ionicons name="flash" size={10} color={colors.accentDark} />
            <Text style={[styles.autoFillText, { color: colors.accentDark }]}>Auto</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function PlayerRow({ player, index, colors }: { player: { name: string; score: number; confidence: number }; index: number; colors: ThemeColors }) {
  return (
    <View style={[styles.playerRow, { borderBottomColor: colors.border + '60' }]}>
      <Text style={[styles.playerIndex, { color: colors.textTertiary }]}>{index + 1}</Text>
      <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={1}>{player.name}</Text>
      <Text style={[styles.playerScore, { color: colors.text }]}>{player.score}</Text>
      <ConfidenceBadge value={player.confidence} colors={colors} />
    </View>
  );
}

export default function OCRResultScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const { colors, t } = useAppSettings();

  const ocrData = useMemo(() => {
    const simulated = simulateOCR();
    const teamNames = ['Mumbai Warriors', 'Delhi Panthers', 'Chennai Riders', 'Kolkata Kings', 'Pune Strikers', 'Jaipur Royals'];
    const venues = ['Shivaji Stadium, Mumbai', 'Nehru Ground, Delhi', 'Chepauk Arena, Chennai', 'Sports Complex, Pune'];
    const i = Math.floor(Math.random() * teamNames.length);
    let j = i;
    while (j === i) j = Math.floor(Math.random() * teamNames.length);

    const teamAScore = simulated.teamAPlayers.reduce((s, p) => s + p.score, 0);
    const teamBScore = simulated.teamBPlayers.reduce((s, p) => s + p.score, 0);

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const autoFilled: string[] = [];
    const venueConf = 0.4 + Math.random() * 0.5;
    if (venueConf < 0.6) autoFilled.push('venue');

    return {
      teamAName: teamNames[i],
      teamANameConfidence: 0.7 + Math.random() * 0.3,
      teamBName: teamNames[j],
      teamBNameConfidence: 0.7 + Math.random() * 0.3,
      teamAPlayers: simulated.teamAPlayers,
      teamBPlayers: simulated.teamBPlayers,
      teamAScore,
      teamBScore,
      date: dateStr,
      dateConfidence: 0.8 + Math.random() * 0.2,
      venue: venues[Math.floor(Math.random() * venues.length)],
      venueConfidence: venueConf,
      autoFilledFields: autoFilled,
    };
  }, []);

  const avgConfidence = useMemo(() => {
    const allConfs = [
      ocrData.teamANameConfidence,
      ocrData.teamBNameConfidence,
      ocrData.dateConfidence,
      ocrData.venueConfidence,
      ...ocrData.teamAPlayers.map(p => p.confidence),
      ...ocrData.teamBPlayers.map(p => p.confidence),
    ];
    return allConfs.reduce((a, b) => a + b, 0) / allConfs.length;
  }, [ocrData]);

  const handleEdit = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/edit-match',
      params: {
        ocrData: JSON.stringify(ocrData),
        imageUri: imageUri || '',
      },
    });
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
        <Text style={[styles.topTitle, { color: colors.text }]}>{t.ocrResults}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.overallCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
          <View style={styles.overallHeader}>
            <Feather name="check-circle" size={20} color={colors.primary} />
            <Text style={[styles.overallTitle, { color: colors.text }]}>{t.extractionComplete}</Text>
          </View>
          <View style={styles.overallStats}>
            <View style={styles.overallStat}>
              <Text style={[styles.overallStatValue, { color: colors.text }]}>{Math.round(avgConfidence * 100)}%</Text>
              <Text style={[styles.overallStatLabel, { color: colors.textSecondary }]}>{t.avgConfidence}</Text>
            </View>
            <View style={[styles.overallDivider, { backgroundColor: colors.border }]} />
            <View style={styles.overallStat}>
              <Text style={[styles.overallStatValue, { color: colors.text }]}>{ocrData.teamAPlayers.length + ocrData.teamBPlayers.length}</Text>
              <Text style={[styles.overallStatLabel, { color: colors.textSecondary }]}>{t.playersFound}</Text>
            </View>
            <View style={[styles.overallDivider, { backgroundColor: colors.border }]} />
            <View style={styles.overallStat}>
              <Text style={[styles.overallStatValue, { color: colors.text }]}>{ocrData.autoFilledFields.length}</Text>
              <Text style={[styles.overallStatLabel, { color: colors.textSecondary }]}>{t.autoFilled}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
          <Text style={[styles.sectionCardTitle, { color: colors.text }]}>{t.matchInfo}</Text>
          <FieldRow label={t.date} value={ocrData.date} confidence={ocrData.dateConfidence} colors={colors} t={t} />
          <FieldRow
            label={t.venue}
            value={ocrData.venue}
            confidence={ocrData.venueConfidence}
            isAutoFilled={ocrData.autoFilledFields.includes('venue')}
            colors={colors}
            t={t}
          />
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
          <View style={styles.teamHeader}>
            <Text style={[styles.sectionCardTitle, { color: colors.text }]}>{ocrData.teamAName}</Text>
            <ConfidenceBadge value={ocrData.teamANameConfidence} colors={colors} />
          </View>
          <View style={[styles.totalScoreRow, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.totalScoreLabel, { color: colors.primary }]}>{t.totalScore}</Text>
            <Text style={[styles.totalScoreValue, { color: colors.primary }]}>{ocrData.teamAScore}</Text>
          </View>
          <View style={[styles.playerHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.playerHeaderText, { flex: 0, width: 24, color: colors.textTertiary }]}>#</Text>
            <Text style={[styles.playerHeaderText, { flex: 1, color: colors.textTertiary }]}>{t.player}</Text>
            <Text style={[styles.playerHeaderText, { color: colors.textTertiary }]}>{t.pts}</Text>
            <Text style={[styles.playerHeaderText, { width: 60, textAlign: 'right', color: colors.textTertiary }]}>{t.conf}</Text>
          </View>
          {ocrData.teamAPlayers.map((player, idx) => (
            <PlayerRow key={idx} player={player} index={idx} colors={colors} />
          ))}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
          <View style={styles.teamHeader}>
            <Text style={[styles.sectionCardTitle, { color: colors.text }]}>{ocrData.teamBName}</Text>
            <ConfidenceBadge value={ocrData.teamBNameConfidence} colors={colors} />
          </View>
          <View style={[styles.totalScoreRow, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.totalScoreLabel, { color: colors.primary }]}>{t.totalScore}</Text>
            <Text style={[styles.totalScoreValue, { color: colors.primary }]}>{ocrData.teamBScore}</Text>
          </View>
          <View style={[styles.playerHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.playerHeaderText, { flex: 0, width: 24, color: colors.textTertiary }]}>#</Text>
            <Text style={[styles.playerHeaderText, { flex: 1, color: colors.textTertiary }]}>{t.player}</Text>
            <Text style={[styles.playerHeaderText, { color: colors.textTertiary }]}>{t.pts}</Text>
            <Text style={[styles.playerHeaderText, { width: 60, textAlign: 'right', color: colors.textTertiary }]}>{t.conf}</Text>
          </View>
          {ocrData.teamBPlayers.map((player, idx) => (
            <PlayerRow key={idx} player={player} index={idx} colors={colors} />
          ))}
        </View>

        {ocrData.autoFilledFields.length > 0 && (
          <View style={[styles.warningCard, { backgroundColor: colors.accent + '18' }]}>
            <Ionicons name="warning-outline" size={18} color={colors.accentDark} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.warningTitle, { color: colors.text }]}>{t.autoFilledDetected}</Text>
              <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                {t.autoFilledDetectedDesc.replace('{fields}', ocrData.autoFilledFields.join(', '))}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16), backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.9 }]}
          onPress={handleEdit}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.editGradient}
          >
            <Feather name="edit-3" size={18} color={colors.white} />
            <Text style={[styles.editButtonText, { color: colors.white }]}>{t.reviewAndEdit}</Text>
          </LinearGradient>
        </Pressable>
      </View>
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
  overallCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  overallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  overallTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
  },
  overallStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallStat: { flex: 1, alignItems: 'center' },
  overallStatValue: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
  },
  overallStatLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
  overallDivider: {
    width: 1,
    height: 32,
  },
  sectionCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    marginBottom: 12,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  totalScoreLabel: {
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
  },
  totalScoreValue: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  fieldLeft: { flex: 1 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    marginTop: 2,
  },
  fieldRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
  },
  autoFillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  autoFillText: {
    fontSize: 9,
    fontFamily: 'Nunito_600SemiBold',
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  playerHeaderText: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    textTransform: 'uppercase',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  playerIndex: {
    width: 24,
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
  },
  playerScore: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    marginRight: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  warningCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  warningTitle: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
  warningText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  editButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  editGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 28,
  },
  editButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
});
