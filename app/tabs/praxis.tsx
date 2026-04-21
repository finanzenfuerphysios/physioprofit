import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function PraxisScreen() {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Zurück</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Meine Praxis</Text>
      <Text style={styles.sub}>Kommt bald 🏥</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', padding: 24, paddingTop: 60 },
  back: { color: '#10B981', fontSize: 16, marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#F1F5F9' },
  sub: { fontSize: 16, color: '#64748B', marginTop: 8 },
});
