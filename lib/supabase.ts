import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800;

const ChunkedSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const first = await SecureStore.getItemAsync(key);
    if (first === null) return null;

    const totalChunks = parseInt(await SecureStore.getItemAsync(`${key}_chunks`) ?? '1', 10);
    if (totalChunks === 1) return first;

    let result = first;
    for (let i = 1; i < totalChunks; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
      if (chunk) result += chunk;
    }
    return result;
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      await SecureStore.setItemAsync(`${key}_chunks`, '1');
      return;
    }

    const chunks = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(key, value.slice(0, CHUNK_SIZE));
    for (let i = 1; i < chunks; i++) {
      await SecureStore.setItemAsync(`${key}_chunk_${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${key}_chunks`, String(chunks));
  },

  async removeItem(key: string): Promise<void> {
    const totalChunks = parseInt(await SecureStore.getItemAsync(`${key}_chunks`) ?? '1', 10);
    await SecureStore.deleteItemAsync(key);
    for (let i = 1; i < totalChunks; i++) {
      await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
    }
    await SecureStore.deleteItemAsync(`${key}_chunks`);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ChunkedSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
