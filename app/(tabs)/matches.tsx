import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  TextInput,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMatches } from '@/context/MatchContext';
import { MatchData } from '@/lib/types';
import { ThemeColors } from '@/constants/colors';

function MatchCard({ match, onDelete, colors, t }: { match: MatchData; onDelete: (id: string) => void; colors: ThemeColors; t: any }) {
  const isDraft = match.status === 'draft';
  const hasAutoFill = match.autoFilledFields.length > 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.matchCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }, pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
      onPress={() => router.push({ pathname: '/match-detail', params: { id: match.id } })}
      onLongPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(t.deleteMatch, t.deleteConfirm, [
          { text: t.cancel, style: 'cancel' },
          { text: t.delete, style: 'destructive', onPress: () => onDelete(match.id) },
        ]);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.teamsContainer}>
          <Text style={[styles.teamNameCard, { color: colors.text }]} numberOfLines={1}>{match.teamA.name}</Text>
          <View style={[styles.scoreBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.scoreBadgeText, { color: colors.primary }]}>
              {match.teamA.totalScore} - {match.teamB.totalScore}
            </Text>
          </View>
          <Text style={[styles.teamNameCard, { color: colors.text }]} numberOfLines={1}>{match.teamB.name}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={[styles.metaValue, { color: colors.textSecondary }]}>{match.date}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
          <Text style={[styles.metaValue, { color: colors.textSecondary }]} numberOfLines={1}>{match.venue}</Text>
        </View>
        <View style={styles.badges}>
          {isDraft && (
            <View style={[styles.badge, { backgroundColor: colors.accent + '30' }]}>
              <Text style={[styles.badgeText, { color: colors.accentDark }]}>{t.draft}</Text>
            </View>
          )}
          {hasAutoFill && (
            <View style={[styles.badge, { backgroundColor: colors.confidenceLow + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.confidenceLow }]}>{t.autoFilled}</Text>
            </View>
          )}
          {!isDraft && (
            <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{t.confirmed}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const { matches, isLoading, refreshMatches, removeMatch } = useMatches();
  const { colors, t } = useAppSettings();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return matches;
    const q = search.toLowerCase();
    return matches.filter(m =>
      m.teamA.name.toLowerCase().includes(q) ||
      m.teamB.name.toLowerCase().includes(q) ||
      m.venue.toLowerCase().includes(q) ||
      m.date.includes(q)
    );
  }, [matches, search]);

  const handleDelete = async (id: string) => {
    await removeMatch(id);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <LinearGradient
      colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
      style={styles.container}
    >
      <View style={[styles.headerArea, { paddingTop: insets.top + webTopInset + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t.savedMatches}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{matches.length} {t.matchesRecorded}</Text>
        <View style={[styles.searchBar, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MatchCard match={item} onDelete={handleDelete} colors={colors} t={t} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshMatches} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {search ? t.noMatchesFound : t.noMatchesYet}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
              {search ? t.tryDifferentSearch : t.capturedAppearHere}
            </Text>
          </View>
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: { paddingHorizontal: 20, marginBottom: 8 },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
    marginBottom: 16,
  },
  searchBar: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    padding: 0,
  },
  listContent: { paddingHorizontal: 20 },
  matchCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: { marginBottom: 12 },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamNameCard: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    flex: 1,
    textAlign: 'center',
  },
  scoreBadge: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 8,
  },
  scoreBadgeText: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaValue: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    maxWidth: 100,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 'auto',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
  },
});
