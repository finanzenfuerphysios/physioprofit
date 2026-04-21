import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/authStore';
import { useBelegeStore } from '../../stores/belegeStore';

function fmt(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BelegeScreen() {
  const { user } = useAuthStore();
  const monat = new Date().toISOString().slice(0, 7);
  const {
    belege,
    schaetzung,
    scanning,
    fetchAll,
    scanBeleg,
    addBeleg,
    deleteBeleg,
    setSchaetzung,
    getBelegeSumme,
    getAbweichung,
  } = useBelegeStore();

  const [schaetzungInput, setSchaetzungInput] = useState('');
  const [confirmModal, setConfirmModal] = useState(false);
  const [pendingBetrag, setPendingBetrag] = useState('');
  const [pendingHaendler, setPendingHaendler] = useState('');
  const [savingSchaetzung, setSavingSchaetzung] = useState(false);
  const [savingBeleg, setSavingBeleg] = useState(false);

  useEffect(() => {
    if (user) fetchAll(user.id, monat);
  }, [user]);

  useEffect(() => {
    if (schaetzung) setSchaetzungInput(String(schaetzung.betrag).replace('.', ','));
  }, [schaetzung]);

  const summe = getBelegeSumme();
  const abweichung = getAbweichung();

  async function speichereSchaetzung() {
    const raw = parseFloat(schaetzungInput.replace(',', '.'));
    if (!raw || raw <= 0) { Alert.alert('Fehler', 'Bitte gültigen Betrag eingeben'); return; }
    setSavingSchaetzung(true);
    const result = await setSchaetzung(user!.id, monat, raw);
    setSavingSchaetzung(false);
    if (result.error) Alert.alert('Fehler', result.error);
    else Keyboard.dismiss();
  }

  async function scannen(source: 'camera' | 'gallery') {
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Zugriff verweigert', 'Bitte erlaube den Zugriff in den Einstellungen');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.6, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6, allowsEditing: true, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.base64) { Alert.alert('Fehler', 'Kein Bild erhalten'); return; }

    const scan = await scanBeleg(asset.base64);
    if (scan.error) {
      Alert.alert('Scan fehlgeschlagen', scan.error);
      return;
    }
    setPendingBetrag(String(scan.betrag).replace('.', ','));
    setPendingHaendler(scan.haendler ?? '');
    setConfirmModal(true);
  }

  async function bestaetigen() {
    const raw = parseFloat(pendingBetrag.replace(',', '.'));
    if (!raw || raw <= 0) { Alert.alert('Fehler', 'Bitte gültigen Betrag eingeben'); return; }
    setSavingBeleg(true);
    const result = await addBeleg(user!.id, { betrag: raw, haendler: pendingHaendler || undefined });
    setSavingBeleg(false);
    if (result.error) Alert.alert('Fehler', result.error);
    else setConfirmModal(false);
  }

  function loeschen(id: string, beschreibung: string) {
    Alert.alert('Beleg löschen?', beschreibung, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: async () => {
        const result = await deleteBeleg(id);
        if (result.error) Alert.alert('Fehler', result.error);
      }},
    ]);
  }

  const abweichungText = abweichung === null
    ? 'Trage oben deine Schätzung ein'
    : Math.abs(abweichung) < 1
      ? '🎯 Fast perfekt geschätzt!'
      : abweichung > 0
        ? `Du hast € ${fmt(abweichung)} mehr ausgegeben als gedacht`
        : `Du lagst € ${fmt(Math.abs(abweichung))} unter deiner Schätzung`;

  const abweichungFarbe = abweichung === null
    ? '#64748B'
    : Math.abs(abweichung ?? 0) < 1
      ? '#10B981'
      : abweichung > 0
        ? '#EF4444'
        : '#10B981';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Zurück</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Belege</Text>
        <Text style={styles.total}>€ {fmt(summe)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.schaetzungCard}>
          <Text style={styles.schaetzungTitle}>Dein Tipp für diesen Monat</Text>
          <Text style={styles.schaetzungSub}>Wie viel denkst du, diesen Monat per Bon auszugeben?</Text>
          <View style={styles.schaetzungRow}>
            <TextInput
              style={styles.schaetzungInput}
              placeholder="€"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              value={schaetzungInput}
              onChangeText={setSchaetzungInput}
              returnKeyType="done"
              onSubmitEditing={speichereSchaetzung}
            />
            <TouchableOpacity style={styles.schaetzungBtn} onPress={speichereSchaetzung} disabled={savingSchaetzung}>
              <Text style={styles.schaetzungBtnText}>{savingSchaetzung ? '...' : '✓'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.abweichung, { color: abweichungFarbe }]}>{abweichungText}</Text>
        </View>

        <View style={styles.scanBlock}>
          <TouchableOpacity style={styles.scanBtn} onPress={() => scannen('camera')} disabled={scanning}>
            {scanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.scanIcon}>📷</Text>
                <Text style={styles.scanLabel}>Beleg fotografieren</Text>
                <Text style={styles.scanSub}>Kamera → Bon → Betrag wird erkannt</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryBtn} onPress={() => scannen('gallery')} disabled={scanning}>
            <Text style={styles.galleryLabel}>Aus Galerie wählen</Text>
          </TouchableOpacity>
        </View>

        {belege.length > 0 ? (
          <View style={styles.liste}>
            <Text style={styles.listeTitle}>Gescannte Belege ({belege.length})</Text>
            {belege.map((b) => (
              <TouchableOpacity key={b.id} style={styles.belegItem} onLongPress={() => loeschen(b.id, b.haendler ?? `Beleg vom ${b.datum}`)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.belegHaendler}>{b.haendler ?? 'Unbekannter Händler'}</Text>
                  <Text style={styles.belegDatum}>{b.datum} · lang drücken zum Löschen</Text>
                </View>
                <Text style={styles.belegBetrag}>- € {fmt(Number(b.betrag))}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyText}>Noch keine Belege diesen Monat. Tippe oben auf „Beleg fotografieren" um loszulegen.</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={confirmModal} transparent animationType="slide" onRequestClose={() => setConfirmModal(false)}>
        <View style={styles.modalRoot}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => { Keyboard.dismiss(); setConfirmModal(false); }}
          />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalBox}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <Text style={styles.modalTitle}>Erkannt ✨</Text>
              <Text style={styles.modalSub}>Prüfe die Werte und bestätige:</Text>

              <Text style={styles.inputLabel}>Betrag in €</Text>
              <TextInput
                style={styles.input}
                placeholder="Betrag"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
                value={pendingBetrag}
                onChangeText={setPendingBetrag}
                returnKeyType="done"
              />

              <Text style={styles.inputLabel}>Händler</Text>
              <TextInput
                style={styles.input}
                placeholder="z.B. REWE"
                placeholderTextColor="#64748B"
                value={pendingHaendler}
                onChangeText={setPendingHaendler}
                returnKeyType="done"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={bestaetigen} disabled={savingBeleg}>
                <Text style={styles.saveBtnText}>{savingBeleg ? 'Wird gespeichert...' : '✓ Speichern'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setConfirmModal(false)}>
                <Text style={styles.cancelText}>Abbrechen</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
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

  schaetzungCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  schaetzungTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
  schaetzungSub: { fontSize: 12, color: '#94A3B8', marginBottom: 12 },
  schaetzungRow: { flexDirection: 'row', gap: 8 },
  schaetzungInput: { flex: 1, backgroundColor: '#0F172A', borderRadius: 10, padding: 14, color: '#F1F5F9', fontSize: 16 },
  schaetzungBtn: { backgroundColor: '#10B981', borderRadius: 10, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  schaetzungBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  abweichung: { fontSize: 13, marginTop: 12, fontWeight: '600' },

  scanBlock: { marginBottom: 24 },
  scanBtn: { backgroundColor: '#10B981', borderRadius: 16, padding: 28, alignItems: 'center', marginBottom: 8 },
  scanIcon: { fontSize: 48, marginBottom: 8 },
  scanLabel: { color: '#fff', fontSize: 18, fontWeight: '800' },
  scanSub: { color: '#D1FAE5', fontSize: 12, marginTop: 4 },
  galleryBtn: { backgroundColor: 'transparent', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  galleryLabel: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },

  liste: { marginTop: 8 },
  listeTitle: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 12 },
  belegItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 10, padding: 14, marginBottom: 8 },
  belegHaendler: { color: '#F1F5F9', fontSize: 14, fontWeight: '600' },
  belegDatum: { color: '#64748B', fontSize: 12, marginTop: 2 },
  belegBetrag: { color: '#EF4444', fontSize: 16, fontWeight: '700' },

  empty: { alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: '#64748B', fontSize: 14, textAlign: 'center', lineHeight: 20 },

  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  modalScroll: { maxHeight: 520, backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalBox: { padding: 28, paddingBottom: 48 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#F1F5F9', marginBottom: 4 },
  modalSub: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  inputLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#0F172A', borderRadius: 10, padding: 16, color: '#F1F5F9', fontSize: 16, marginBottom: 12 },
  saveBtn: { backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelText: { color: '#64748B', textAlign: 'center', marginTop: 16, fontSize: 15 },
});
