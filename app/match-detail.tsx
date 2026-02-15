import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMatches } from '@/context/MatchContext';
import { Player } from '@/lib/types';
import { ThemeColors } from '@/constants/colors';

function PlayerDetailRow({ player, index, colors }: { player: Player; index: number; colors: ThemeColors }) {
  return (
    <View style={[styles.playerRow, { borderBottomColor: colors.border + '60' }]}>
      <Text style={[styles.playerIndex, { color: colors.textTertiary }]}>{index + 1}</Text>
      <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={1}>{player.name}</Text>
      <View style={[styles.playerScoreBubble, { backgroundColor: colors.primaryLight }]}>
        <Text style={[styles.playerScoreText, { color: colors.primary }]}>{player.score}</Text>
      </View>
    </View>
  );
}

export default function MatchDetailScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMatchById, removeMatch } = useMatches();
  const { colors, t } = useAppSettings();

  const match = getMatchById(id || '');

  if (!match) {
    return (
      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
        style={styles.container}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + webTopInset + 8 }]}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={[styles.topTitle, { color: colors.text }]}>{t.matchDetails}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t.matchNotFound}</Text>
        </View>
      </LinearGradient>
    );
  }

  const handleEdit = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/edit-match',
      params: { matchId: match.id },
    });
  };

  const handleDelete = () => {
    Alert.alert(t.deleteMatch, t.deleteConfirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          await removeMatch(match.id);
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      },
    ]);
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
        <Text style={[styles.topTitle, { color: colors.text }]}>{t.matchDetails}</Text>
        <Pressable onPress={handleDelete} style={[styles.deleteBtn, { backgroundColor: colors.negative + '12' }]}>
          <Ionicons name="trash-outline" size={20} color={colors.negative} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroTeams}>
              <View style={styles.heroTeam}>
                <Text style={styles.heroTeamName} numberOfLines={2}>{match.teamA.name}</Text>
                <Text style={styles.heroScore}>{match.teamA.totalScore}</Text>
              </View>
              <View style={styles.heroVs}>
                <Text style={styles.heroVsText}>{t.vs}</Text>
              </View>
              <View style={styles.heroTeam}>
                <Text style={styles.heroTeamName} numberOfLines={2}>{match.teamB.name}</Text>
                <Text style={styles.heroScore}>{match.teamB.totalScore}</Text>
              </View>
            </View>
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroMetaText}>{match.date}</Text>
              </View>
              <View style={styles.heroMetaItem}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                <Text style={styles.heroMetaText} numberOfLines={1}>{match.venue || 'N/A'}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.statusRow}>
          {match.status === 'confirmed' ? (
            <View style={[styles.statusBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              <Text style={[styles.statusBadgeText, { color: colors.primary }]}>{t.confirmed}</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: colors.accent + '30' }]}>
              <Ionicons name="create" size={14} color={colors.accentDark} />
              <Text style={[styles.statusBadgeText, { color: colors.accentDark }]}>{t.draft}</Text>
            </View>
          )}
          {match.autoFilledFields.length > 0 && (
            <View style={[styles.statusBadge, { backgroundColor: colors.confidenceLow + '18' }]}>
              <Ionicons name="flash" size={14} color={colors.confidenceLow} />
              <Text style={[styles.statusBadgeText, { color: colors.confidenceLow }]}>
                {match.autoFilledFields.length} {t.autoFilled}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
          <View style={styles.teamCardHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{match.teamA.name}</Text>
            <View style={[styles.teamTotalPill, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.teamTotalText, { color: colors.primary }]}>{match.teamA.totalScore} {t.pts}</Text>
            </View>
          </View>
          {match.teamA.players.map((player, idx) => (
            <PlayerDetailRow key={idx} player={player} index={idx} colors={colors} />
          ))}
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
          <View style={styles.teamCardHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{match.teamB.name}</Text>
            <View style={[styles.teamTotalPill, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.teamTotalText, { color: colors.primary }]}>{match.teamB.totalScore} {t.pts}</Text>
            </View>
          </View>
          {match.teamB.players.map((player, idx) => (
            <PlayerDetailRow key={idx} player={player} index={idx} colors={colors} />
          ))}
        </View>

        <View style={[styles.watermarkCard, { backgroundColor: colors.watermark, borderColor: colors.primary + '20' }]}>
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          <Text style={[styles.watermarkText, { color: colors.primary }]}>{t.digitizedBy}</Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16), backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.editBtn, { borderColor: colors.primary }, pressed && { opacity: 0.9 }]}
          onPress={handleEdit}
        >
          <Feather name="edit-3" size={18} color={colors.primary} />
          <Text style={[styles.editBtnText, { color: colors.primary }]}>{t.edit}</Text>
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
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 20 },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroGradient: {
    padding: 24,
    borderRadius: 24,
  },
  heroTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroTeam: {
    flex: 1,
    alignItems: 'center',
  },
  heroTeamName: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  heroScore: {
    fontSize: 36,
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
  },
  heroVs: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  heroVsText: {
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
    color: 'rgba(255,255,255,0.8)',
  },
  heroMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 14,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: 'rgba(255,255,255,0.85)',
    maxWidth: 120,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
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
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
  },
  teamTotalPill: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  teamTotalText: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
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
  playerScoreBubble: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  playerScoreText: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
  },
  watermarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  watermarkText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
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
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 28,
    borderWidth: 1.5,
    paddingVertical: 14,
  },
  editBtnText: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },
});
