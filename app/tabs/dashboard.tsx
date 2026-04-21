import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../stores/authStore';

export default function DashboardScreen() {
  const { user, userType, signOut } = useAuthStore();
  const name = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Physio';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hallo, {name} 👋</Text>
          <Text style={styles.subGreeting}>{userType === 'selbststaendig' ? 'Selbstständig' : 'Angestellt'}</Text>
        </View>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.logout}>Abmelden</Text>
        </TouchableOpacity>
      </View>

      {/* Gewinn-Card */}
      <View style={styles.profitCard}>
        <Text style={styles.profitLabel}>Aktueller Gewinn</Text>
        <Text style={styles.profitAmount}>€ 0,00</Text>
        <Text style={styles.profitSub}>Dieser Monat</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Einnahmen</Text>
          <Text style={styles.statValue}>€ 0</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Ausgaben</Text>
          <Text style={styles.statValue}>€ 0</Text>
        </View>
        <View style={[styles.statCard, userType === 'angestellt' && styles.hidden]}>
          <Text style={styles.statLabel}>Steuern</Text>
          <Text style={styles.statValue}>€ 0</Text>
        </View>
      </View>

      {/* Coach Hinweis */}
      <View style={styles.coachCard}>
        <Text style={styles.coachIcon}>💡</Text>
        <Text style={styles.coachText}>Trage deine ersten Einnahmen ein, um deinen Gewinn zu berechnen.</Text>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navGrid}>
        <TouchableOpacity style={styles.navCard}>
          <Text style={styles.navIcon}>💰</Text>
          <Text style={styles.navLabel}>Einnahmen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navLabel}>Ausgaben</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard}>
          <Text style={styles.navIcon}>🎯</Text>
          <Text style={styles.navLabel}>Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard}>
          <Text style={styles.navIcon}>🏥</Text>
          <Text style={styles.navLabel}>Praxis</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#F1F5F9' },
  subGreeting: { fontSize: 14, color: '#10B981', marginTop: 2 },
  logout: { color: '#64748B', fontSize: 14 },
  profitCard: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  profitLabel: { fontSize: 14, color: '#D1FAE5', fontWeight: '600', marginBottom: 8 },
  profitAmount: { fontSize: 48, fontWeight: '900', color: '#fff' },
  profitSub: { fontSize: 13, color: '#D1FAE5', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  hidden: { opacity: 0, pointerEvents: 'none' },
  statLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#F1F5F9' },
  coachCard: {
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  coachIcon: { fontSize: 24 },
  coachText: { flex: 1, color: '#93C5FD', fontSize: 14, lineHeight: 20 },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  navCard: {
    width: '47%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  navIcon: { fontSize: 32, marginBottom: 8 },
  navLabel: { fontSize: 14, fontWeight: '600', color: '#F1F5F9' },
});
