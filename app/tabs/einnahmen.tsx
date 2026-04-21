import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useFinanzStore } from '../../stores/finanzStore';

const QUELLEN = [
  {
    label: 'Physiotherapie',
    icon: '💊',
    details: ['Kassenpatient', 'Privatpatient', 'Selbstzahler', 'Hausbesuch', 'Gruppentherapie'],
  },
  {
    label: 'Nebentätigkeit',
    icon: '💼',
    details: ['Kurs / Seminar', 'Beratung', 'Online-Therapie', 'Gutachten / Bericht', 'Sonstiges'],
  },
  {
    label: 'Immobilien',
    icon: '🏠',
    details: ['Mieteinnahmen', 'Untervermietung', 'Sonstiges'],
  },
  {
    label: 'Kapitalerträge',
    icon: '📈',
    details: ['Dividenden', 'ETF / Fonds', 'Zinsen', 'Sonstiges'],
  },
  {
    label: 'Sonstiges',
    icon: '➕',
    details: ['Geschenk / Erbschaft', 'Steuererstattung', 'Verkauf', 'Sonstiges'],
  },
];

export default function EinnahmenScreen() {
  const { user } = useAuthStore();
  const { einnahmen, addEinnahme } = useFinanzStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [quelle, setQuelle] = useState('');
  const [quelleDetail, setQuelleDetail] = useState('');
  const [betrag, setBetrag] = useState('');
  const [isBrutto, setIsBrutto] = useState(false);
  const [steuersatz, setSteuersatz] = useState('30');
  const [saving, setSaving] = useState(false);

  function openModal(q: string, d: string) {
    setQuelle(q);
    setQuelleDetail(d);
    setBetrag('');
    setIsBrutto(false);
    setModal(true);
  }

  async function speichern() {
    const raw = parseFloat(betrag.replace(',', '.'));
    if (!raw || raw <= 0) { Alert.alert('Fehler', 'Bitte gültigen Betrag eingeben'); return; }

    setSaving(true);
    const steuer = parseFloat(steuersatz) / 100;
    const netto = isBrutto ? raw * (1 - steuer) : raw;
    await addEinnahme(user!.id, {
      betrag_netto: Math.round(netto * 100) / 100,
      betrag_brutto: isBrutto ? raw : undefined,
      steuersatz: isBrutto ? parseFloat(steuersatz) : undefined,
      quelle,
      quelle_detail: quelleDetail,
      datum: new Date().toISOString().slice(0, 10),
    });
    setSaving(false);
    setModal(false);
  }

  const total = einnahmen.reduce((s, e) => s + e.betrag_netto, 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Einnahmen</Text>
        <Text style={styles.total}>€ {total.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {QUELLEN.map((q) => (
          <View key={q.label}>
            <TouchableOpacity style={styles.kategorie} onPress={() => setExpanded(expanded === q.label ? null : q.label)}>
              <Text style={styles.kategorieIcon}>{q.icon}</Text>
              <Text style={styles.kategorieLabel}>{q.label}</Text>
              <Text style={styles.arrow}>{expanded === q.label ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {expanded === q.label && q.details.map((d) => (
              <TouchableOpacity key={d} style={styles.detail} onPress={() => openModal(q.label, d)}>
                <Text style={styles.detailText}>{d}</Text>
                <Text style={styles.detailPlus}>+ Eintragen</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {einnahmen.length > 0 && (
          <View style={styles.verlauf}>
            <Text style={styles.verlaufTitle}>Eingetragen diesen Monat</Text>
            {einnahmen.map((e) => (
              <View key={e.id} style={styles.verlaufItem}>
                <View>
                  <Text style={styles.verlaufQuelle}>{e.quelle_detail ?? e.quelle}</Text>
                  <Text style={styles.verlaufDatum}>{e.datum}</Text>
                </View>
                <Text style={styles.verlaufBetrag}>+ € {e.betrag_netto.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{quelleDetail}</Text>
            <Text style={styles.modalSub}>{quelle}</Text>

            <View style={styles.toggleRow}>
              <TouchableOpacity style={[styles.toggle, !isBrutto && styles.toggleActive]} onPress={() => setIsBrutto(false)}>
                <Text style={[styles.toggleText, !isBrutto && styles.toggleTextActive]}>Netto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggle, isBrutto && styles.toggleActive]} onPress={() => setIsBrutto(true)}>
                <Text style={[styles.toggleText, isBrutto && styles.toggleTextActive]}>Brutto</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Betrag in €"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              value={betrag}
              onChangeText={setBetrag}
            />

            {isBrutto && (
              <TextInput
                style={styles.input}
                placeholder="Steuersatz in % (z.B. 30)"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
                value={steuersatz}
                onChangeText={setSteuersatz}
              />
            )}

            {isBrutto && betrag !== '' && (
              <Text style={styles.nettoHint}>
                ≈ Netto: € {(parseFloat(betrag.replace(',', '.') || '0') * (1 - parseFloat(steuersatz) / 100)).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
              </Text>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={speichern} disabled={saving}>
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
  total: { fontSize: 16, fontWeight: '700', color: '#10B981' },
  content: { padding: 16, paddingBottom: 40 },
  kategorie: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 8 },
  kategorieIcon: { fontSize: 24, marginRight: 12 },
  kategorieLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: '#F1F5F9' },
  arrow: { color: '#64748B', fontSize: 14 },
  detail: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0F1F35', borderRadius: 8, padding: 14, marginBottom: 4, marginLeft: 16 },
  detailText: { color: '#CBD5E1', fontSize: 15 },
  detailPlus: { color: '#10B981', fontSize: 13, fontWeight: '600' },
  verlauf: { marginTop: 24 },
  verlaufTitle: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 12 },
  verlaufItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 10, padding: 14, marginBottom: 8 },
  verlaufQuelle: { color: '#F1F5F9', fontSize: 14, fontWeight: '600' },
  verlaufDatum: { color: '#64748B', fontSize: 12, marginTop: 2 },
  verlaufBetrag: { color: '#10B981', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 48 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#F1F5F9', marginBottom: 4 },
  modalSub: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  toggleRow: { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 10, padding: 4, marginBottom: 16 },
  toggle: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  toggleActive: { backgroundColor: '#10B981' },
  toggleText: { color: '#64748B', fontWeight: '600' },
  toggleTextActive: { color: '#fff' },
  input: { backgroundColor: '#0F172A', borderRadius: 10, padding: 16, color: '#F1F5F9', fontSize: 16, marginBottom: 12 },
  nettoHint: { color: '#10B981', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  saveBtn: { backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelText: { color: '#64748B', textAlign: 'center', marginTop: 16, fontSize: 15 },
});
