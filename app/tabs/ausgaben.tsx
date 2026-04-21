import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useFinanzStore } from '../../stores/finanzStore';

const KATEGORIEN = [
  {
    id: 'alltag' as const,
    label: 'Alltag',
    icon: '🏠',
    farbe: '#3B82F6',
    details: ['Miete / Nebenkosten', 'Lebensmittel', 'Haushalt', 'Transport / Auto', 'Versicherungen', 'Strom / Internet', 'Kleidung', 'Gesundheit / Apotheke', 'Sonstiges'],
  },
  {
    id: 'freizeit' as const,
    label: 'Freizeit',
    icon: '🎉',
    farbe: '#F59E0B',
    details: ['Restaurant / Café', 'Shopping', 'Urlaub / Reisen', 'Hobby', 'Sport / Fitness', 'Unterhaltung / Streaming', 'Ausgehen / Feiern', 'Sonstiges'],
  },
  {
    id: 'investition' as const,
    label: 'Investitionen',
    icon: '📈',
    farbe: '#10B981',
    details: ['ETFs / Aktien', 'Fonds', 'Goldsparpläne', 'Altersvorsorge / Rente', 'Immobilien', 'Weiterbildung / Kurse', 'Sonstiges'],
  },
  {
    id: 'steuer' as const,
    label: 'Steuern',
    icon: '📑',
    farbe: '#EF4444',
    details: ['Einkommenssteuer', 'Steuervorauszahlung', 'Steuerberater', 'Sonstiges'],
  },
];

export default function AusgabenScreen() {
  const { user, userType } = useAuthStore();
  const { ausgaben, addAusgabe } = useFinanzStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [kategorie, setKategorie] = useState<'alltag' | 'freizeit' | 'investition' | 'steuer'>('alltag');
  const [unterkategorie, setUnterkategorie] = useState('');
  const [betrag, setBetrag] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [saving, setSaving] = useState(false);

  const sichtbareKategorien = KATEGORIEN.filter(k => userType === 'selbststaendig' || k.id !== 'steuer');

  function openModal(k: typeof kategorie, u: string) {
    setKategorie(k);
    setUnterkategorie(u);
    setBetrag('');
    setBeschreibung('');
    setModal(true);
  }

  async function speichern() {
    const raw = parseFloat(betrag.replace(',', '.'));
    if (!raw || raw <= 0) { Alert.alert('Fehler', 'Bitte gültigen Betrag eingeben'); return; }
    setSaving(true);
    await addAusgabe(user!.id, {
      betrag: raw,
      kategorie,
      unterkategorie,
      beschreibung: beschreibung || undefined,
      datum: new Date().toISOString().slice(0, 10),
    });
    setSaving(false);
    setModal(false);
  }

  const total = ausgaben.reduce((s, a) => s + a.betrag, 0);
  const aktKategorie = KATEGORIEN.find(k => k.id === kategorie);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ausgaben</Text>
        <Text style={styles.total}>€ {total.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {sichtbareKategorien.map((k) => (
          <View key={k.id}>
            <TouchableOpacity style={[styles.kategorie, { borderLeftColor: k.farbe }]} onPress={() => setExpanded(expanded === k.id ? null : k.id)}>
              <Text style={styles.kategorieIcon}>{k.icon}</Text>
              <Text style={styles.kategorieLabel}>{k.label}</Text>
              <Text style={styles.kategorieTotal}>€ {ausgaben.filter(a => a.kategorie === k.id).reduce((s, a) => s + a.betrag, 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}</Text>
              <Text style={styles.arrow}>{expanded === k.id ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {expanded === k.id && k.details.map((d) => (
              <TouchableOpacity key={d} style={styles.detail} onPress={() => openModal(k.id, d)}>
                <Text style={styles.detailText}>{d}</Text>
                <Text style={[styles.detailPlus, { color: k.farbe }]}>+ Eintragen</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {ausgaben.length > 0 && (
          <View style={styles.verlauf}>
            <Text style={styles.verlaufTitle}>Ausgaben diesen Monat</Text>
            {ausgaben.slice().reverse().map((a) => (
              <View key={a.id} style={styles.verlaufItem}>
                <View>
                  <Text style={styles.verlaufQuelle}>{a.unterkategorie}</Text>
                  <Text style={styles.verlaufDatum}>{a.datum} · {a.kategorie}</Text>
                </View>
                <Text style={styles.verlaufBetrag}>- € {a.betrag.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{unterkategorie}</Text>
            <Text style={[styles.modalSub, { color: aktKategorie?.farbe }]}>{aktKategorie?.icon} {aktKategorie?.label}</Text>

            <TextInput
              style={styles.input}
              placeholder="Betrag in €"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              value={betrag}
              onChangeText={setBetrag}
            />
            <TextInput
              style={styles.input}
              placeholder="Notiz (optional)"
              placeholderTextColor="#64748B"
              value={beschreibung}
              onChangeText={setBeschreibung}
            />

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: aktKategorie?.farbe }]} onPress={speichern} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Wird gespeichert...' : 'Speichern'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModal(false)}>
              <Text style={styles.cancelText}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingTop: 60 },
  back: { color: '#10B981', fontSize: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#F1F5F9' },
  total: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
  content: { padding: 16, paddingBottom: 40 },
  kategorie: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 8, borderLeftWidth: 4 },
  kategorieIcon: { fontSize: 24, marginRight: 12 },
  kategorieLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: '#F1F5F9' },
  kategorieTotal: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginRight: 8 },
  arrow: { color: '#64748B', fontSize: 14 },
  detail: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F1F35', borderRadius: 8, padding: 14, marginBottom: 4, marginLeft: 16 },
  detailText: { color: '#CBD5E1', fontSize: 15 },
  detailPlus: { fontSize: 13, fontWeight: '600' },
  verlauf: { marginTop: 24 },
  verlaufTitle: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 12 },
  verlaufItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 10, padding: 14, marginBottom: 8 },
  verlaufQuelle: { color: '#F1F5F9', fontSize: 14, fontWeight: '600' },
  verlaufDatum: { color: '#64748B', fontSize: 12, marginTop: 2 },
  verlaufBetrag: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 48 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#F1F5F9', marginBottom: 4 },
  modalSub: { fontSize: 14, fontWeight: '600', marginBottom: 20 },
  input: { backgroundColor: '#0F172A', borderRadius: 10, padding: 16, color: '#F1F5F9', fontSize: 16, marginBottom: 12 },
  saveBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelText: { color: '#64748B', textAlign: 'center', marginTop: 16, fontSize: 15 },
});
