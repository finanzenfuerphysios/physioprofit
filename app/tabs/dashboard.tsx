import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useFinanzStore } from '../../stores/finanzStore';

function fmt(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DashboardScreen() {
  const { user, userType, signOut } = useAuthStore();
  const { fetchMonat, getGewinn, getEinnahmenTotal, getAusgabenTotal, getAusgabenByKategorie } = useFinanzStore();
  const name = user?.user_metadata?.full_name?.split(' ')[0] ?? 'Physio';
  const monat = new Date().toISOString().slice(0, 7);

  useFocusEffect(
    useCallback(() => {
      if (user) fetchMonat(user.id, monat);
    }, [user])
  );

  const einnahmen = getEinnahmenTotal();
  const ausgaben = getAusgabenTotal();
  const gewinn = getGewinn();
  const istNegativ = gewinn < 0;

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

      {/* Hauptkarten */}
      <View style={styles.topRow}>
        <View style={[styles.gewinnCard, istNegativ && styles.gewinnCardRed]}>
          <Text style={styles.gewinnLabel}>Aktueller Gewinn</Text>
          <Text style={styles.gewinnBetrag}>€ {fmt(gewinn)}</Text>
          <Text style={styles.gewinnSub}>nach Ausgaben</Text>
        </View>
        <View style={styles.ohneCard}>
          <Text style={styles.ohneLabel}>Ohne Ausgaben</Text>
          <Text style={styles.ohneBetrag}>€ {fmt(einnahmen)}</Text>
          <Text style={styles.ohneSub}>Monats-Einnahme</Text>
        </View>
      </View>

      {/* Ausgaben-Übersicht */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ausgaben diesen Monat</Text>
        <View style={styles.kontenRow}>
          <View style={styles.kontoCard}>
            <Text style={styles.kontoIcon}>🏠</Text>
            <Text style={styles.kontoLabel}>Alltag</Text>
            <Text style={styles.kontoWert}>€ {fmt(getAusgabenByKategorie('alltag'))}</Text>
          </View>
          <View style={styles.kontoCard}>
            <Text style={styles.kontoIcon}>🎉</Text>
            <Text style={styles.kontoLabel}>Freizeit</Text>
            <Text style={styles.kontoWert}>€ {fmt(getAusgabenByKategorie('freizeit'))}</Text>
          </View>
          <View style={styles.kontoCard}>
            <Text style={styles.kontoIcon}>📈</Text>
            <Text style={styles.kontoLabel}>Invest.</Text>
            <Text style={styles.kontoWert}>€ {fmt(getAusgabenByKategorie('investition'))}</Text>
          </View>
          {userType === 'selbststaendig' && (
            <View style={styles.kontoCard}>
              <Text style={styles.kontoIcon}>📑</Text>
              <Text style={styles.kontoLabel}>Steuern</Text>
              <Text style={styles.kontoWert}>€ {fmt(getAusgabenByKategorie('steuer'))}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Coach Hinweis */}
      {einnahmen === 0 && (
        <View style={styles.coachCard}>
          <Text style={styles.coachIcon}>💡</Text>
          <Text style={styles.coachText}>Trage deine Einnahmen für diesen Monat ein, um deinen Gewinn zu sehen.</Text>
        </View>
      )}
      {istNegativ && (
        <View style={[styles.coachCard, styles.coachRed]}>
          <Text style={styles.coachIcon}>⚠️</Text>
          <Text style={[styles.coachText, styles.coachTextRed]}>Deine Ausgaben übersteigen deine Einnahmen. Überprüfe deine Ausgaben.</Text>
        </View>
      )}

      {/* Navigation */}
      <View style={styles.navGrid}>
        <TouchableOpacity style={styles.navCard} onPress={() => router.push('/tabs/einnahmen')}>
          <Text style={styles.navIcon}>💰</Text>
          <Text style={styles.navLabel}>Einnahmen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard} onPress={() => router.push('/tabs/ausgaben')}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navLabel}>Ausgaben</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard} onPress={() => router.push('/tabs/quiz')}>
          <Text style={styles.navIcon}>🎯</Text>
          <Text style={styles.navLabel}>Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navCard} onPress={() => router.push('/tabs/praxis')}>
          <Text style={styles.navIcon}>🏥</Text>
          <Text style={styles.navLabel}>Praxis</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#F1F5F9' },
  subGreeting: { fontSize: 13, color: '#10B981', marginTop: 2 },
  logout: { color: '#64748B', fontSize: 14 },
  topRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  gewinnCard: { flex: 1, backgroundColor: '#10B981', borderRadius: 16, padding: 18, alignItems: 'center' },
  gewinnCardRed: { backgroundColor: '#EF4444' },
  gewinnLabel: { fontSize: 12, color: '#D1FAE5', fontWeight: '600', marginBottom: 6 },
  gewinnBetrag: { fontSize: 26, fontWeight: '900', color: '#fff' },
  gewinnSub: { fontSize: 11, color: '#D1FAE5', marginTop: 4 },
  ohneCard: { flex: 1, backgroundColor: '#1E293B', borderRadius: 16, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  ohneLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 6 },
  ohneBetrag: { fontSize: 26, fontWeight: '900', color: '#F1F5F9' },
  ohneSub: { fontSize: 11, color: '#64748B', marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#94A3B8', marginBottom: 12 },
  kontenRow: { flexDirection: 'row', gap: 8 },
  kontoCard: { flex: 1, backgroundColor: '#1E293B', borderRadius: 12, padding: 12, alignItems: 'center' },
  kontoIcon: { fontSize: 20, marginBottom: 4 },
  kontoLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 4 },
  kontoWert: { fontSize: 13, fontWeight: '700', color: '#F1F5F9' },
  coachCard: { backgroundColor: '#1E3A5F', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  coachRed: { backgroundColor: '#3B1A1A', borderLeftColor: '#EF4444' },
  coachIcon: { fontSize: 22 },
  coachText: { flex: 1, color: '#93C5FD', fontSize: 14, lineHeight: 20 },
  coachTextRed: { color: '#FCA5A5' },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  navCard: { width: '47%', backgroundColor: '#1E293B', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  navIcon: { fontSize: 32, marginBottom: 8 },
  navLabel: { fontSize: 14, fontWeight: '600', color: '#F1F5F9' },
});
