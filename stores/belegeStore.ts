import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Beleg {
  id: string;
  betrag: number;
  haendler?: string;
  datum: string;
  created_at: string;
}

interface Schaetzung {
  monat: string;
  betrag: number;
}

interface BelegeState {
  belege: Beleg[];
  schaetzung: Schaetzung | null;
  loading: boolean;
  scanning: boolean;
  fetchAll: (userId: string, monat: string) => Promise<void>;
  scanBeleg: (imageBase64: string) => Promise<{ betrag?: number; haendler?: string; error?: string }>;
  addBeleg: (userId: string, data: { betrag: number; haendler?: string }) => Promise<{ error?: string }>;
  deleteBeleg: (id: string) => Promise<{ error?: string }>;
  setSchaetzung: (userId: string, monat: string, betrag: number) => Promise<{ error?: string }>;
  getBelegeSumme: () => number;
  getAbweichung: () => number | null;
}

export const useBelegeStore = create<BelegeState>((set, get) => ({
  belege: [],
  schaetzung: null,
  loading: false,
  scanning: false,

  fetchAll: async (userId, monat) => {
    set({ loading: true });
    try {
      const [belegeRes, schaetzungRes] = await Promise.all([
        supabase
          .from('belege')
          .select('*')
          .eq('user_id', userId)
          .gte('datum', `${monat}-01`)
          .lte('datum', `${monat}-31`)
          .order('created_at', { ascending: false }),
        supabase
          .from('schaetzungen')
          .select('monat, betrag')
          .eq('user_id', userId)
          .eq('monat', monat)
          .maybeSingle(),
      ]);
      const updates: any = { loading: false };
      if (!belegeRes.error) updates.belege = belegeRes.data ?? [];
      else console.warn('[belegeStore] belege fetch error:', belegeRes.error);
      if (!schaetzungRes.error) updates.schaetzung = schaetzungRes.data ?? null;
      else console.warn('[belegeStore] schaetzung fetch error:', schaetzungRes.error);
      set(updates);
    } catch (e: any) {
      console.warn('[belegeStore] fetchAll failed:', e?.message);
      set({ loading: false });
    }
  },

  scanBeleg: async (imageBase64) => {
    set({ scanning: true });
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Zeitüberschreitung beim Scannen (45s)')), 45000)
      );
      const request = supabase.functions.invoke('scan-beleg', {
        body: { image_base64: imageBase64 },
      });
      const { data, error } = (await Promise.race([request, timeout])) as any;
      set({ scanning: false });
      if (error) return { error: error.message ?? 'Scan fehlgeschlagen' };
      if (data?.error) return { error: data.error };
      const betrag = typeof data?.betrag === 'number' ? data.betrag : parseFloat(data?.betrag);
      if (!betrag || isNaN(betrag) || betrag <= 0) {
        return { error: 'Kein Betrag erkannt — bitte Bon klarer fotografieren' };
      }
      return { betrag, haendler: data?.haendler ?? undefined };
    } catch (e: any) {
      set({ scanning: false });
      return { error: e?.message ?? 'Unbekannter Fehler beim Scan' };
    }
  },

  addBeleg: async (userId, data) => {
    try {
      const { data: rows, error } = await supabase
        .from('belege')
        .insert({
          user_id: userId,
          betrag: data.betrag,
          haendler: data.haendler ?? null,
          datum: new Date().toISOString().slice(0, 10),
        })
        .select();
      if (error) return { error: `${error.code ?? ''} ${error.message}`.trim() };
      if (!rows?.[0]) return { error: 'Gespeichert, aber leere Rückgabe — RLS-Policy prüfen' };
      set((s) => ({ belege: [rows[0], ...s.belege] }));
      return {};
    } catch (e: any) {
      return { error: e?.message ?? 'Unbekannter Fehler' };
    }
  },

  deleteBeleg: async (id) => {
    try {
      const { error } = await supabase.from('belege').delete().eq('id', id);
      if (error) return { error: `${error.code ?? ''} ${error.message}`.trim() };
      set((s) => ({ belege: s.belege.filter((b) => b.id !== id) }));
      return {};
    } catch (e: any) {
      return { error: e?.message ?? 'Unbekannter Fehler' };
    }
  },

  setSchaetzung: async (userId, monat, betrag) => {
    try {
      const { data: rows, error } = await supabase
        .from('schaetzungen')
        .upsert({ user_id: userId, monat, betrag }, { onConflict: 'user_id,monat' })
        .select();
      if (error) return { error: `${error.code ?? ''} ${error.message}`.trim() };
      if (rows?.[0]) set({ schaetzung: { monat, betrag: Number(rows[0].betrag) } });
      return {};
    } catch (e: any) {
      return { error: e?.message ?? 'Unbekannter Fehler' };
    }
  },

  getBelegeSumme: () => get().belege.reduce((s, b) => s + Number(b.betrag), 0),
  getAbweichung: () => {
    const s = get().schaetzung;
    if (!s) return null;
    return get().getBelegeSumme() - Number(s.betrag);
  },
}));
