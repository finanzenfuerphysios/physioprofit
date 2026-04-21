import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

export default function UserTypeScreen() {
  const { user, setUserType } = useAuthStore();

  async function select(type: 'angestellt' | 'selbststaendig') {
    setUserType(type);
    await supabase.from('profiles').upsert({
      id: user?.id,
      user_type: type,
      updated_at: new Date().toISOString(),
    });
    router.replace('/tabs/dashboard');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wie arbeitest du?</Text>
      <Text style={styles.subtitle}>Das bestimmt deine Konten und Funktionen</Text>

      <TouchableOpacity style={styles.card} onPress={() => select('angestellt')}>
        <Text style={styles.cardIcon}>👔</Text>
        <Text style={styles.cardTitle}>Angestellt</Text>
        <Text style={styles.cardDesc}>Du arbeitest in einer Praxis oder Klinik als Angestellter</Text>
        <Text style={styles.cardFeatures}>Konten: Alltag · Freizeit · Investitionen</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.card, styles.cardGreen]} onPress={() => select('selbststaendig')}>
        <Text style={styles.cardIcon}>🏥</Text>
        <Text style={styles.cardTitle}>Selbstständig</Text>
        <Text style={styles.cardDesc}>Du führst deine eigene Praxis oder arbeitest auf Rechnung</Text>
        <Text style={styles.cardFeatures}>Konten: Alltag · Freizeit · Investitionen · Steuern</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#F1F5F9', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#94A3B8', textAlign: 'center', marginBottom: 40 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#334155',
  },
  cardGreen: { borderColor: '#10B981' },
  cardIcon: { fontSize: 40, marginBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#F1F5F9', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#94A3B8', marginBottom: 12 },
  cardFeatures: { fontSize: 13, color: '#10B981', fontWeight: '600' },
});
