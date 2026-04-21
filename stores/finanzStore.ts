import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Einnahme {
  id: string;
  betrag_netto: number;
  betrag_brutto?: number;
  quelle: string;
  quelle_detail?: string;
  datum: string;
}

interface Ausgabe {
  id: string;
  betrag: number;
  kategorie: 'alltag' | 'freizeit' | 'investition' | 'steuer';
  unterkategorie: string;
  beschreibung?: string;
  datum: string;
}

interface FinanzState {
  einnahmen: Einnahme[];
  ausgaben: Ausgabe[];
  loading: boolean;
  fetchMonat: (userId: string, monat: string) => Promise<void>;
  addEinnahme: (userId: string, data: Omit<Einnahme, 'id'>) => Promise<{ error?: string }>;
  addAusgabe: (userId: string, data: Omit<Ausgabe, 'id'>) => Promise<{ error?: string }>;
  getGewinn: () => number;
  getEinnahmenTotal: () => number;
  getAusgabenTotal: () => number;
  getAusgabenByKategorie: (k: string) => number;
}

export const useFinanzStore = create<FinanzState>((set, get) => ({
  einnahmen: [],
  ausgaben: [],
  loading: false,

  fetchMonat: async (userId, monat) => {
    set({ loading: true });
    try {
      const [{ data: e }, { data: a }] = await Promise.all([
        supabase.from('einnahmen').select('*').eq('user_id', userId).gte('datum', `${monat}-01`).lte('datum', `${monat}-31`),
        supabase.from('ausgaben').select('*').eq('user_id', userId).gte('datum', `${monat}-01`).lte('datum', `${monat}-31`),
      ]);
      set({ einnahmen: e ?? [], ausgaben: a ?? [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addEinnahme: async (userId, data) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { error: 'Nicht angemeldet — bitte neu einloggen' };

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Zeitüberschreitung (15s) — vermutlich RLS-Policy-Problem in Supabase')), 15000)
      );
      const request = supabase
        .from('einnahmen')
        .insert({ user_id: userId, ...data })
        .select();
      const { data: rows, error } = (await Promise.race([request, timeout])) as any;
      if (error) return { error: `${error.code ?? ''} ${error.message}`.trim() };
      if (rows?.[0]) set((s) => ({ einnahmen: [...s.einnahmen, rows[0]] }));
      return {};
    } catch (e: any) {
      return { error: e?.message ?? 'Unbekannter Fehler' };
    }
  },

  addAusgabe: async (userId, data) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { error: 'Nicht angemeldet — bitte neu einloggen' };

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Zeitüberschreitung (15s) — vermutlich RLS-Policy-Problem in Supabase')), 15000)
      );
      const request = supabase
        .from('ausgaben')
        .insert({ user_id: userId, ...data })
        .select();
      const { data: rows, error } = (await Promise.race([request, timeout])) as any;
      if (error) return { error: `${error.code ?? ''} ${error.message}`.trim() };
      if (rows?.[0]) set((s) => ({ ausgaben: [...s.ausgaben, rows[0]] }));
      return {};
    } catch (e: any) {
      return { error: e?.message ?? 'Unbekannter Fehler' };
    }
  },

  getEinnahmenTotal: () => get().einnahmen.reduce((s, e) => s + Number(e.betrag_netto), 0),
  getAusgabenTotal: () => get().ausgaben.reduce((s, a) => s + Number(a.betrag), 0),
  getGewinn: () => get().getEinnahmenTotal() - get().getAusgabenTotal(),
  getAusgabenByKategorie: (k) => get().ausgaben.filter((a) => a.kategorie === k).reduce((s, a) => s + Number(a.betrag), 0),
}));
