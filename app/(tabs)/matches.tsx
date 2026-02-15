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
import Colors from '@/constants/colors';
import { useMatches } from '@/context/MatchContext';
import { MatchData } from '@/lib/types';

function MatchCard({ match, onDelete }: { match: MatchData; onDelete: (id: string) => void }) {
  const isDraft = match.status === 'draft';
  const hasAutoFill = match.autoFilledFields.length > 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.matchCard, pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
      onPress={() => router.push({ pathname: '/match-detail', params: { id: match.id } })}
      onLongPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert('Delete Match', 'Are you sure you want to delete this match?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDelete(match.id) },
        ]);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.teamsContainer}>
          <Text style={styles.teamNameCard} numberOfLines={1}>{match.teamA.name}</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>
              {match.teamA.totalScore} - {match.teamB.totalScore}
            </Text>
          </View>
          <Text style={styles.teamNameCard} numberOfLines={1}>{match.teamB.name}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={Colors.light.textSecondary} />
          <Text style={styles.metaValue}>{match.date}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={Colors.light.textSecondary} />
          <Text style={styles.metaValue} numberOfLines={1}>{match.venue}</Text>
        </View>
        <View style={styles.badges}>
          {isDraft && (
            <View style={[styles.badge, { backgroundColor: Colors.light.accent + '30' }]}>
              <Text style={[styles.badgeText, { color: Colors.light.accentDark }]}>Draft</Text>
            </View>
          )}
          {hasAutoFill && (
            <View style={[styles.badge, { backgroundColor: Colors.light.confidenceLow + '20' }]}>
              <Text style={[styles.badgeText, { color: Colors.light.confidenceLow }]}>Auto-filled</Text>
            </View>
          )}
          {!isDraft && (
            <View style={[styles.badge, { backgroundColor: Colors.light.primaryLight }]}>
              <Text style={[styles.badgeText, { color: Colors.light.primary }]}>Confirmed</Text>
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
      colors={[Colors.light.backgroundGradientStart, Colors.light.backgroundGradientEnd]}
      style={styles.container}
    >
      <View style={[styles.headerArea, { paddingTop: insets.top + webTopInset + 16 }]}>
        <Text style={styles.title}>Saved Matches</Text>
        <Text style={styles.subtitle}>{matches.length} matches recorded</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.light.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by team, venue, or date..."
            placeholderTextColor={Colors.light.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={Colors.light.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MatchCard match={item} onDelete={handleDelete} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshMatches} tintColor={Colors.light.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={Colors.light.textTertiary} />
            <Text style={styles.emptyTitle}>
              {search ? 'No matches found' : 'No saved matches'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {search ? 'Try a different search term' : 'Captured scoresheets will appear here'}
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
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowColor: Colors.light.cardShadow,
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
    color: Colors.light.text,
    padding: 0,
  },
  listContent: { paddingHorizontal: 20 },
  matchCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    shadowColor: Colors.light.cardShadow,
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
    color: Colors.light.text,
    flex: 1,
    textAlign: 'center',
  },
  scoreBadge: {
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 8,
  },
  scoreBadgeText: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.primary,
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
    color: Colors.light.textSecondary,
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
    color: Colors.light.textSecondary,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textTertiary,
  },
});
