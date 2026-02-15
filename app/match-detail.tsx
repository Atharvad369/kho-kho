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
import Colors from '@/constants/colors';
import { useMatches } from '@/context/MatchContext';
import { Player } from '@/lib/types';

function PlayerDetailRow({ player, index }: { player: Player; index: number }) {
  return (
    <View style={styles.playerRow}>
      <Text style={styles.playerIndex}>{index + 1}</Text>
      <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
      <View style={styles.playerScoreBubble}>
        <Text style={styles.playerScoreText}>{player.score}</Text>
      </View>
    </View>
  );
}

export default function MatchDetailScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMatchById, removeMatch } = useMatches();

  const match = getMatchById(id || '');

  if (!match) {
    return (
      <LinearGradient
        colors={[Colors.light.backgroundGradientStart, Colors.light.backgroundGradientEnd]}
        style={styles.container}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + webTopInset + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.topTitle}>Match Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.light.textTertiary} />
          <Text style={styles.emptyTitle}>Match not found</Text>
        </View>
      </LinearGradient>
    );
  }

  const winner = match.teamA.totalScore >= match.teamB.totalScore ? match.teamA : match.teamB;

  const handleEdit = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/edit-match',
      params: { matchId: match.id },
    });
  };

  const handleDelete = () => {
    Alert.alert('Delete Match', 'Are you sure you want to delete this match?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
      colors={[Colors.light.backgroundGradientStart, Colors.light.backgroundGradientEnd]}
      style={styles.container}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.topTitle}>Match Details</Text>
        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={Colors.light.negative} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[Colors.light.primary, '#2D8A5E']}
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
                <Text style={styles.heroVsText}>VS</Text>
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
                <Text style={styles.heroMetaText} numberOfLines={1}>{match.venue || 'Not specified'}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.statusRow}>
          {match.status === 'confirmed' ? (
            <View style={[styles.statusBadge, { backgroundColor: Colors.light.primaryLight }]}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.light.primary} />
              <Text style={[styles.statusBadgeText, { color: Colors.light.primary }]}>Confirmed</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: Colors.light.accent + '30' }]}>
              <Ionicons name="create" size={14} color={Colors.light.accentDark} />
              <Text style={[styles.statusBadgeText, { color: Colors.light.accentDark }]}>Draft</Text>
            </View>
          )}
          {match.autoFilledFields.length > 0 && (
            <View style={[styles.statusBadge, { backgroundColor: Colors.light.confidenceLow + '18' }]}>
              <Ionicons name="flash" size={14} color={Colors.light.confidenceLow} />
              <Text style={[styles.statusBadgeText, { color: Colors.light.confidenceLow }]}>
                {match.autoFilledFields.length} Auto-filled
              </Text>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.teamCardHeader}>
            <Text style={styles.sectionTitle}>{match.teamA.name}</Text>
            <View style={styles.teamTotalPill}>
              <Text style={styles.teamTotalText}>{match.teamA.totalScore} pts</Text>
            </View>
          </View>
          {match.teamA.players.map((player, idx) => (
            <PlayerDetailRow key={idx} player={player} index={idx} />
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.teamCardHeader}>
            <Text style={styles.sectionTitle}>{match.teamB.name}</Text>
            <View style={styles.teamTotalPill}>
              <Text style={styles.teamTotalText}>{match.teamB.totalScore} pts</Text>
            </View>
          </View>
          {match.teamB.players.map((player, idx) => (
            <PlayerDetailRow key={idx} player={player} index={idx} />
          ))}
        </View>

        <View style={styles.watermarkCard}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.light.primary} />
          <Text style={styles.watermarkText}>Digitized by KhoKho Score</Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 16) }]}>
        <Pressable
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.9 }]}
          onPress={handleEdit}
        >
          <Feather name="edit-3" size={18} color={Colors.light.primary} />
          <Text style={styles.editBtnText}>Edit</Text>
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
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.light.negative + '12',
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
    color: Colors.light.white,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroScore: {
    fontSize: 36,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.white,
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
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  teamTotalPill: {
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  teamTotalText: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.primary,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
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
  playerScoreBubble: {
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  playerScoreText: {
    fontSize: 13,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.primary,
  },
  watermarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
    opacity: 0.5,
  },
  watermarkText: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.primary,
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
    color: Colors.light.textSecondary,
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
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    paddingVertical: 14,
  },
  editBtnText: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.primary,
  },
});
