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
import { useAppSettings } from '@/context/AppSettingsContext';
import { useMatches } from '@/context/MatchContext';
import { ThemeColors } from '@/constants/colors';

function StatCard({ icon, label, value, color, colors }: { icon: string; label: string; value: number; color: string; colors: ThemeColors }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function RecentMatchItem({ match, colors }: { match: any; colors: ThemeColors }) {
  const isDraft = match.status === 'draft';

  return (
    <Pressable
      style={({ pressed }) => [styles.recentCard, { backgroundColor: colors.card, shadowColor: colors.cardShadow }, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
      onPress={() => router.push({ pathname: '/match-detail', params: { id: match.id } })}
    >
      <View style={styles.recentCardLeft}>
        <View style={styles.teamsRow}>
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>{match.teamA.name}</Text>
          <Text style={[styles.vsText, { color: colors.textTertiary }]}>vs</Text>
          <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={1}>{match.teamB.name}</Text>
        </View>
        <View style={styles.matchMeta}>
          <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{match.date}</Text>
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} style={{ marginLeft: 8 }} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>{match.venue}</Text>
        </View>
      </View>
      <View style={styles.recentCardRight}>
        <Text style={[styles.scoreText, { color: colors.text }]}>
          {match.teamA.totalScore} - {match.teamB.totalScore}
        </Text>
        {isDraft ? (
          <View style={[styles.statusPill, { backgroundColor: colors.accent + '30' }]}>
            <Text style={[styles.statusText, { color: colors.accentDark }]}>Draft</Text>
          </View>
        ) : (
          <View style={[styles.statusPill, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.statusText, { color: colors.primary }]}>Confirmed</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { stats, isLoading, refreshMatches } = useMatches();
  const { colors, t } = useAppSettings();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

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
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshMatches} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>{t.appName}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t.digitizeSubtitle}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [styles.settingsBtn, { backgroundColor: colors.card }, pressed && { opacity: 0.85 }]}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={20} color={colors.text} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.captureBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.85 }]}
              onPress={() => router.push('/(tabs)/capture')}
            >
              <Ionicons name="add" size={22} color={colors.white} />
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="documents-outline" label={t.total} value={stats.totalMatches} color={colors.primary} colors={colors} />
          <StatCard icon="checkmark-circle-outline" label={t.confirmed} value={stats.confirmedMatches} color={colors.positive} colors={colors} />
          <StatCard icon="create-outline" label={t.drafts} value={stats.draftMatches} color={colors.accentDark} colors={colors} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.quickActionCard, pressed && { opacity: 0.92 }]}
          onPress={() => router.push('/(tabs)/capture')}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickActionGradient}
          >
            <View style={styles.quickActionContent}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="camera" size={28} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickActionTitle, { color: colors.white }]}>{t.scanScoresheet}</Text>
                <Text style={styles.quickActionSub}>{t.scanScoresheetDesc}</Text>
              </View>
              <Feather name="arrow-right" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.recentMatches}</Text>
          {stats.recentMatches.length > 0 && (
            <Pressable onPress={() => router.push('/(tabs)/matches')}>
              <Text style={[styles.seeAllText, { color: colors.primary }]}>{t.seeAll}</Text>
            </Pressable>
          )}
        </View>

        {stats.recentMatches.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t.noMatchesYet}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>{t.captureToStart}</Text>
          </View>
        ) : (
          stats.recentMatches.map(match => (
            <RecentMatchItem key={match.id} match={match} colors={colors} />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0,0,0,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  captureBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
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
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Nunito_500Medium',
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
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
  recentCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    maxWidth: 90,
  },
  vsText: {
    fontSize: 11,
    fontFamily: 'Nunito_400Regular',
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
    maxWidth: 80,
  },
  recentCardRight: { alignItems: 'flex-end' },
  scoreText: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
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
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
  },
});
