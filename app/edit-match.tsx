import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMatches } from '@/context/MatchContext';
import { generateId, generateFingerprint } from '@/lib/match-storage';
import { MatchData, OCRResult, Player } from '@/lib/types';
import { ThemeColors } from '@/constants/colors';

function EditableField({ label, value, onChangeText, confidence, isAutoFilled, multiline, colors, t }: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  confidence?: number;
  isAutoFilled?: boolean;
  multiline?: boolean;
  colors: ThemeColors;
  t: any;
}) {
  const isLowConf = confidence !== undefined && confidence < 0.6;
  return (
    <View style={[styles.editField, isLowConf && { backgroundColor: colors.confidenceLow + '08', borderRadius: 12, padding: 10, marginHorizontal: -10 }]}>
      <View style={styles.editFieldHeader}>
        <Text style={[styles.editFieldLabel, { color: colors.textSecondary }]}>{label}</Text>
        {isAutoFilled && (
          <View style={[styles.autoTag, { backgroundColor: colors.accent + '25' }]}>
            <Ionicons name="flash" size={10} color={colors.accentDark} />
            <Text style={[styles.autoTagText, { color: colors.accentDark }]}>{t.autoSuggested}</Text>
          </View>
        )}
      </View>
      <TextInput
        style={[styles.editFieldInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }, multiline && { minHeight: 48, textAlignVertical: 'top' as const }]}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
      />
      {isLowConf && (
        <Text style={[styles.lowConfText, { color: colors.confidenceLow }]}>{t.lowConfidence}</Text>
      )}
    </View>
  );
}

function PlayerEditRow({ player, index, onUpdate, colors }: {
  player: Player;
  index: number;
  onUpdate: (name: string, score: string) => void;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.playerEditRow}>
      <Text style={[styles.playerEditIndex, { color: colors.textTertiary }]}>{index + 1}</Text>
      <TextInput
        style={[styles.playerEditName, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
        value={player.name}
        onChangeText={(text) => onUpdate(text, String(player.score))}
        placeholderTextColor={colors.textTertiary}
      />
      <TextInput
        style={[styles.playerEditScore, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
        value={String(player.score)}
        onChangeText={(text) => onUpdate(player.name, text)}
        keyboardType="numeric"
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  );
}

export default function EditMatchScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const { ocrData: ocrDataStr, imageUri, matchId } = useLocalSearchParams<{
    ocrData?: string;
    imageUri?: string;
    matchId?: string;
  }>();
  const { addOrUpdateMatch, getMatchById } = useMatches();
  const { colors, t } = useAppSettings();

  const existingMatch = matchId ? getMatchById(matchId) : undefined;
  const ocrData: OCRResult | null = ocrDataStr ? JSON.parse(ocrDataStr) : null;

  const [teamAName, setTeamAName] = useState(existingMatch?.teamA.name || ocrData?.teamAName || '');
  const [teamBName, setTeamBName] = useState(existingMatch?.teamB.name || ocrData?.teamBName || '');
  const [date, setDate] = useState(existingMatch?.date || ocrData?.date || '');
  const [venue, setVenue] = useState(existingMatch?.venue || ocrData?.venue || '');
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>(
    existingMatch?.teamA.players || ocrData?.teamAPlayers || []
  );
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>(
    existingMatch?.teamB.players || ocrData?.teamBPlayers || []
  );

  const autoFilledFields = ocrData?.autoFilledFields || existingMatch?.autoFilledFields || [];

  const teamAScore = useMemo(() => teamAPlayers.reduce((s, p) => s + p.score, 0), [teamAPlayers]);
  const teamBScore = useMemo(() => teamBPlayers.reduce((s, p) => s + p.score, 0), [teamBPlayers]);

  const updateTeamAPlayer = (index: number, name: string, score: string) => {
    setTeamAPlayers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name, score: parseInt(score) || 0 };
      return updated;
    });
  };

  const updateTeamBPlayer = (index: number, name: string, score: string) => {
    setTeamBPlayers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name, score: parseInt(score) || 0 };
      return updated;
    });
  };

  const addPlayer = (team: 'A' | 'B') => {
    const newPlayer: Player = { name: '', score: 0, confidence: 1 };
    if (team === 'A') {
      setTeamAPlayers(prev => [...prev, newPlayer]);
    } else {
      setTeamBPlayers(prev => [...prev, newPlayer]);
    }
  };

  const handleSave = async (status: 'draft' | 'confirmed') => {
    if (!teamAName.trim() || !teamBName.trim()) {
      Alert.alert(t.missingInfo, t.enterBothTeams);
      return;
    }
    if (!date.trim()) {
      Alert.alert(t.missingInfo, t.enterDate);
      return;
    }

    const fingerprint = generateFingerprint(teamAName, teamBName, date, venue);

    const match: MatchData = {
      id: existingMatch?.id || generateId(),
      date,
      venue,
      venueConfidence: ocrData?.venueConfidence || 1,
      dateConfidence: ocrData?.dateConfidence || 1,
      teamA: {
        name: teamAName,
        nameConfidence: ocrData?.teamANameConfidence || 1,
        players: teamAPlayers,
        totalScore: teamAScore,
      },
      teamB: {
        name: teamBName,
        nameConfidence: ocrData?.teamBNameConfidence || 1,
        players: teamBPlayers,
        totalScore: teamBScore,
      },
      imageUri: imageUri || existingMatch?.imageUri,
      createdAt: existingMatch?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAutoFilled: autoFilledFields.length > 0,
      autoFilledFields,
      status,
      fingerprint,
    };

    const result = await addOrUpdateMatch(match);
    if (result.duplicate) {
      Alert.alert(t.duplicateMatch, t.duplicateMatchDesc);
      return;
    }

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.dismissAll();
    router.replace('/(tabs)/matches');
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
        <Text style={[styles.topTitle, { color: colors.text }]}>{existingMatch ? t.editMatch : t.confirmData}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.matchInfo}</Text>
            <EditableField label={t.date} value={date} onChangeText={setDate} confidence={ocrData?.dateConfidence} colors={colors} t={t} />
            <EditableField label={t.venue} value={venue} onChangeText={setVenue} confidence={ocrData?.venueConfidence} isAutoFilled={autoFilledFields.includes('venue')} colors={colors} t={t} />
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
            <View style={styles.teamSectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.teamA}</Text>
              <View style={[styles.teamScorePill, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.teamScorePillText, { color: colors.primary }]}>{teamAScore} {t.pts}</Text>
              </View>
            </View>
            <EditableField label={t.teamName} value={teamAName} onChangeText={setTeamAName} confidence={ocrData?.teamANameConfidence} colors={colors} t={t} />
            <Text style={[styles.playersLabel, { color: colors.textSecondary }]}>{t.players}</Text>
            {teamAPlayers.map((player, idx) => (
              <PlayerEditRow key={idx} player={player} index={idx} onUpdate={(name, score) => updateTeamAPlayer(idx, name, score)} colors={colors} />
            ))}
            <Pressable style={({ pressed }) => [styles.addPlayerBtn, pressed && { opacity: 0.7 }]} onPress={() => addPlayer('A')}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.addPlayerText, { color: colors.primary }]}>{t.addPlayer}</Text>
            </Pressable>
          </View>

          <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
            <View style={styles.teamSectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.teamB}</Text>
              <View style={[styles.teamScorePill, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.teamScorePillText, { color: colors.primary }]}>{teamBScore} {t.pts}</Text>
              </View>
            </View>
            <EditableField label={t.teamName} value={teamBName} onChangeText={setTeamBName} confidence={ocrData?.teamBNameConfidence} colors={colors} t={t} />
            <Text style={[styles.playersLabel, { color: colors.textSecondary }]}>{t.players}</Text>
            {teamBPlayers.map((player, idx) => (
              <PlayerEditRow key={idx} player={player} index={idx} onUpdate={(name, score) => updateTeamBPlayer(idx, name, score)} colors={colors} />
            ))}
            <Pressable style={({ pressed }) => [styles.addPlayerBtn, pressed && { opacity: 0.7 }]} onPress={() => addPlayer('B')}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.addPlayerText, { color: colors.primary }]}>{t.addPlayer}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16), backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Pressable style={({ pressed }) => [styles.draftButton, { borderColor: colors.primary }, pressed && { opacity: 0.9 }]} onPress={() => handleSave('draft')}>
          <Text style={[styles.draftButtonText, { color: colors.primary }]}>{t.saveDraft}</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.confirmButton, pressed && { opacity: 0.9 }]} onPress={() => handleSave('confirmed')}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmGradient}
          >
            <Feather name="check" size={18} color={colors.white} />
            <Text style={[styles.confirmButtonText, { color: colors.white }]}>{t.confirm}</Text>
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
  sectionCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    marginBottom: 12,
  },
  teamSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamScorePill: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  teamScorePillText: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
  },
  editField: {
    marginBottom: 14,
  },
  editFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  editFieldLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  autoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  autoTagText: {
    fontSize: 9,
    fontFamily: 'Nunito_600SemiBold',
  },
  editFieldInput: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Nunito_500Medium',
    borderWidth: 1,
  },
  lowConfText: {
    fontSize: 11,
    fontFamily: 'Nunito_500Medium',
    marginTop: 4,
  },
  playersLabel: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    marginTop: 8,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playerEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  playerEditIndex: {
    width: 20,
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    textAlign: 'center',
  },
  playerEditName: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    borderWidth: 1,
  },
  playerEditScore: {
    width: 54,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    textAlign: 'center',
    borderWidth: 1,
  },
  addPlayerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  addPlayerText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  draftButton: {
    flex: 1,
    borderRadius: 28,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
  },
  draftButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },
  confirmButton: {
    flex: 1.5,
    borderRadius: 28,
    overflow: 'hidden',
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 28,
  },
  confirmButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },
});
