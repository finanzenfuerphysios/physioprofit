import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

export default function UserTypeScreen() {
  const { user, setUserType } = useAuthStore();
  const [selected, setSelected] = useState<'angestellt' | 'selbststaendig' | null>(null);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    if (!selected || !user) return;
    setSaving(true);
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Zeitüberschreitung — prüfe Supabase RLS-Policies für profiles')), 15000)
      );
      const request = supabase.from('profiles').upsert({
        id: user.id,
        user_type: selected,
        full_name: user.user_metadata?.full_name ?? null,
        updated_at: new Date().toISOString(),
      });
      const { error } = (await Promise.race([request, timeout])) as any;
      if (error) {
        Alert.alert('Fehler', `${error.code ?? ''} ${error.message}`.trim());
        setSaving(false);
        return;
      }
      setUserType(selected);
      setSaving(false);
      router.replace('/tabs/dashboard');
    } catch (e: any) {
      Alert.alert('Fehler', e?.message ?? 'Unbekannter Fehler');
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wie arbeitest du?</Text>
      <Text style={styles.subtitle}>Das bestimmt deine Konten und Funktionen{'\n'}(kannst du später ändern)</Text>

      <TouchableOpacity
        style={[styles.card, selected === 'angestellt' && styles.cardSelected]}
        onPress={() => setSelected('angestellt')}
      >
        <Text style={styles.cardIcon}>👔</Text>
        <Text style={styles.cardTitle}>Angestellt</Text>
        <Text style={styles.cardDesc}>Du arbeitest in einer Praxis oder Klinik als Angestellter</Text>
        <Text style={styles.cardFeatures}>Konten: Alltag · Freizeit · Investitionen</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.card, selected === 'selbststaendig' && styles.cardSelected]}
        onPress={() => setSelected('selbststaendig')}
      >
        <Text style={styles.cardIcon}>🏥</Text>
        <Text style={styles.cardTitle}>Selbstständig</Text>
        <Text style={styles.cardDesc}>Du führst deine eigene Praxis oder arbeitest auf Rechnung</Text>
        <Text style={styles.cardFeatures}>Konten: Alltag · Freizeit · Investitionen · Steuern</Text>
      </TouchableOpacity>

      {selected && (
        <TouchableOpacity style={styles.confirmBtn} onPress={confirm} disabled={saving}>
          <Text style={styles.confirmBtnText}>{saving ? 'Wird gespeichert...' : '✓ Bestätigen'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#F1F5F9', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  card: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 2, borderColor: '#334155' },
  cardSelected: { borderColor: '#10B981', backgroundColor: '#064E3B' },
  cardIcon: { fontSize: 32, marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#F1F5F9', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#94A3B8', marginBottom: 8 },
  cardFeatures: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  confirmBtn: { backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
