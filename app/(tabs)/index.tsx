import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useMatches } from '@/context/MatchContext';

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RecentMatchItem({ match }: { match: any }) {
  const winner = match.teamA.totalScore >= match.teamB.totalScore ? match.teamA.name : match.teamB.name;
  const isDraft = match.status === 'draft';

  return (
    <Pressable
      style={({ pressed }) => [styles.recentCard, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
      onPress={() => router.push({ pathname: '/match-detail', params: { id: match.id } })}
    >
      <View style={styles.recentCardLeft}>
        <View style={styles.teamsRow}>
          <Text style={styles.teamName} numberOfLines={1}>{match.teamA.name}</Text>
          <Text style={styles.vsText}>vs</Text>
          <Text style={styles.teamName} numberOfLines={1}>{match.teamB.name}</Text>
        </View>
        <View style={styles.matchMeta}>
          <Ionicons name="calendar-outline" size={12} color={Colors.light.textSecondary} />
          <Text style={styles.metaText}>{match.date}</Text>
          <Ionicons name="location-outline" size={12} color={Colors.light.textSecondary} style={{ marginLeft: 8 }} />
          <Text style={styles.metaText} numberOfLines={1}>{match.venue}</Text>
        </View>
      </View>
      <View style={styles.recentCardRight}>
        <Text style={styles.scoreText}>
          {match.teamA.totalScore} - {match.teamB.totalScore}
        </Text>
        {isDraft ? (
          <View style={[styles.statusPill, { backgroundColor: Colors.light.accent + '30' }]}>
            <Text style={[styles.statusText, { color: Colors.light.accentDark }]}>Draft</Text>
          </View>
        ) : (
          <View style={[styles.statusPill, { backgroundColor: Colors.light.primaryLight }]}>
            <Text style={[styles.statusText, { color: Colors.light.primary }]}>Confirmed</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { stats, isLoading, refreshMatches } = useMatches();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <LinearGradient
      colors={[Colors.light.backgroundGradientStart, Colors.light.backgroundGradientEnd]}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + webTopInset + 16, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshMatches} tintColor={Colors.light.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>KhoKho Score</Text>
            <Text style={styles.subtitle}>Digitize your scoresheets</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.push('/(tabs)/capture')}
          >
            <Ionicons name="add" size={22} color={Colors.light.white} />
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="documents-outline" label="Total" value={stats.totalMatches} color={Colors.light.primary} />
          <StatCard icon="checkmark-circle-outline" label="Confirmed" value={stats.confirmedMatches} color={Colors.light.positive} />
          <StatCard icon="create-outline" label="Drafts" value={stats.draftMatches} color={Colors.light.accentDark} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.quickActionCard, pressed && { opacity: 0.92 }]}
          onPress={() => router.push('/(tabs)/capture')}
        >
          <LinearGradient
            colors={[Colors.light.primary, '#2D8A5E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickActionGradient}
          >
            <View style={styles.quickActionContent}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="camera" size={28} color={Colors.light.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickActionTitle}>Scan Scoresheet</Text>
                <Text style={styles.quickActionSub}>Capture or upload a kho-kho scoresheet</Text>
              </View>
              <Feather name="arrow-right" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Matches</Text>
          {stats.recentMatches.length > 0 && (
            <Pressable onPress={() => router.push('/(tabs)/matches')}>
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          )}
        </View>

        {stats.recentMatches.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={Colors.light.textTertiary} />
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptySubtitle}>Capture a scoresheet to get started</Text>
          </View>
        ) : (
          stats.recentMatches.map(match => (
            <RecentMatchItem key={match.id} match={match} />
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  captureBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_500Medium',
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  quickActionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  quickActionGradient: {
    borderRadius: 24,
    padding: 20,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontSize: 17,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.white,
  },
  quickActionSub: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.primary,
  },
  recentCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  recentCardLeft: { flex: 1, marginRight: 12 },
  teamsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  teamName: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.light.text,
    maxWidth: 90,
  },
  vsText: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textTertiary,
  },
  matchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
    color: Colors.light.textSecondary,
    maxWidth: 80,
  },
  recentCardRight: { alignItems: 'flex-end' },
  scoreText: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: Colors.light.text,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
