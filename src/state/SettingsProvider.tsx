import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ensureSeed } from '../data/seed';
import { getSettings, updateSettings as persistSettings } from '../data/settings';
import type { Settings } from '../data/types';

interface SettingsContextValue {
  settings: Settings | null;
  ready: boolean;
  reload: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

const Ctx = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    setSettings(await getSettings());
  }, []);

  useEffect(() => {
    (async () => {
      await ensureSeed();
      const s = await getSettings();
      setSettings(s);
      setReady(true);
    })();
  }, []);

  const update = useCallback(
    async (patch: Partial<Settings>) => {
      await persistSettings(patch);
      setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
    },
    []
  );

  return <Ctx.Provider value={{ settings, ready, reload, update }}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSettings must be used inside SettingsProvider');
  return v;
}
