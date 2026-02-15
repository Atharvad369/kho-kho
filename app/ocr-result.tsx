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
import Colors from '@/constants/colors';
import { simulateOCR } from '@/lib/match-storage';

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 85 ? Colors.light.confidenceHigh :
    pct >= 60 ? Colors.light.confidenceMedium :
    Colors.light.confidenceLow;

  return (
    <View style={[styles.confidenceBadge, { backgroundColor: color + '18' }]}>
      <View style={[styles.confidenceDot, { backgroundColor: color }]} />
      <Text style={[styles.confidenceText, { color }]}>{pct}%</Text>
    </View>
  );
}

function FieldRow({ label, value, confidence, isAutoFilled }: {
  label: string;
  value: string;
  confidence: number;
  isAutoFilled?: boolean;
}) {
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldLeft}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
      <View style={styles.fieldRight}>
        <ConfidenceBadge value={confidence} />
        {isAutoFilled && (
          <View style={styles.autoFillBadge}>
            <Ionicons name="flash" size={10} color={Colors.light.accentDark} />
            <Text style={styles.autoFillText}>Auto</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function PlayerRow({ player, index }: { player: { name: string; score: number; confidence: number }; index: number }) {
  return (
    <View style={styles.playerRow}>
      <Text style={styles.playerIndex}>{index + 1}</Text>
      <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
      <Text style={styles.playerScore}>{player.score}</Text>
      <ConfidenceBadge value={player.confidence} />
    </View>
  );
}

export default function OCRResultScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();

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
      colors={[Colors.light.backgroundGradientStart, Colors.light.backgroundGradientEnd]}
      style={styles.container}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.topTitle}>OCR Results</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.overallCard}>
          <View style={styles.overallHeader}>
            <Feather name="check-circle" size={20} color={Colors.light.primary} />
            <Text style={styles.overallTitle}>Extraction Complete</Text>
          </View>
          <View style={styles.overallStats}>
            <View style={styles.overallStat}>
              <Text style={styles.overallStatValue}>{Math.round(avgConfidence * 100)}%</Text>
              <Text style={styles.overallStatLabel}>Avg Confidence</Text>
            </View>
            <View style={styles.overallDivider} />
            <View style={styles.overallStat}>
              <Text style={styles.overallStatValue}>{ocrData.teamAPlayers.length + ocrData.teamBPlayers.length}</Text>
              <Text style={styles.overallStatLabel}>Players Found</Text>
            </View>
            <View style={styles.overallDivider} />
            <View style={styles.overallStat}>
              <Text style={styles.overallStatValue}>{ocrData.autoFilledFields.length}</Text>
              <Text style={styles.overallStatLabel}>Auto-filled</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>Match Info</Text>
          <FieldRow label="Date" value={ocrData.date} confidence={ocrData.dateConfidence} />
          <FieldRow
            label="Venue"
            value={ocrData.venue}
            confidence={ocrData.venueConfidence}
            isAutoFilled={ocrData.autoFilledFields.includes('venue')}
          />
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.teamHeader}>
            <Text style={styles.sectionCardTitle}>{ocrData.teamAName}</Text>
            <ConfidenceBadge value={ocrData.teamANameConfidence} />
          </View>
          <View style={styles.totalScoreRow}>
            <Text style={styles.totalScoreLabel}>Total Score</Text>
            <Text style={styles.totalScoreValue}>{ocrData.teamAScore}</Text>
          </View>
          <View style={styles.playerHeader}>
            <Text style={[styles.playerHeaderText, { flex: 0, width: 24 }]}>#</Text>
            <Text style={[styles.playerHeaderText, { flex: 1 }]}>Player</Text>
            <Text style={styles.playerHeaderText}>Pts</Text>
            <Text style={[styles.playerHeaderText, { width: 60, textAlign: 'right' }]}>Conf.</Text>
          </View>
          {ocrData.teamAPlayers.map((player, idx) => (
            <PlayerRow key={idx} player={player} index={idx} />
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.teamHeader}>
            <Text style={styles.sectionCardTitle}>{ocrData.teamBName}</Text>
            <ConfidenceBadge value={ocrData.teamBNameConfidence} />
          </View>
          <View style={styles.totalScoreRow}>
            <Text style={styles.totalScoreLabel}>Total Score</Text>
            <Text style={styles.totalScoreValue}>{ocrData.teamBScore}</Text>
          </View>
          <View style={styles.playerHeader}>
            <Text style={[styles.playerHeaderText, { flex: 0, width: 24 }]}>#</Text>
            <Text style={[styles.playerHeaderText, { flex: 1 }]}>Player</Text>
            <Text style={styles.playerHeaderText}>Pts</Text>
            <Text style={[styles.playerHeaderText, { width: 60, textAlign: 'right' }]}>Conf.</Text>
          </View>
          {ocrData.teamBPlayers.map((player, idx) => (
            <PlayerRow key={idx} player={player} index={idx} />
          ))}
        </View>

        {ocrData.autoFilledFields.length > 0 && (
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={18} color={Colors.light.accentDark} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Auto-filled fields detected</Text>
              <Text style={styles.warningText}>
                The following fields had low confidence and were auto-suggested: {ocrData.autoFilledFields.join(', ')}. Please review before confirming.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) }]}>
        <Pressable
          style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.9 }]}
          onPress={handleEdit}
        >
          <LinearGradient
            colors={[Colors.light.primary, '#2D8A5E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.editGradient}
          >
            <Feather name="edit-3" size={18} color={Colors.light.white} />
            <Text style={styles.editButtonText}>Review & Edit</Text>
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
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  scrollContent: { paddingHorizontal: 20 },
  overallCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.light.cardShadow,
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
    color: Colors.light.text,
  },
  overallStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallStat: { flex: 1, alignItems: 'center' },
  overallStatValue: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  overallStatLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  overallDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.light.border,
  },
  sectionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
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
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  totalScoreLabel: {
    fontSize: 13,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.primary,
  },
  totalScoreValue: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.primary,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  fieldLeft: { flex: 1 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.text,
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
    backgroundColor: Colors.light.accent + '25',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  autoFillText: {
    fontSize: 9,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.accentDark,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    marginBottom: 4,
  },
  playerHeaderText: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.textTertiary,
    textTransform: 'uppercase',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border + '60',
  },
  playerIndex: {
    width: 24,
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.textTertiary,
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.text,
  },
  playerScore: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
    marginRight: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  warningCard: {
    backgroundColor: Colors.light.accent + '18',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  warningTitle: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.text,
  },
  warningText: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.card,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
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
    color: Colors.light.white,
  },
});
