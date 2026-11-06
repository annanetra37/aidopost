"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, type Me } from "./api";
import { PaywallModal } from "./PaywallModal";
import { identify } from "@/lib/analytics";

type Ctx = { me: Me | null; refresh: () => Promise<void>; openPaywall: () => void };
const StudioCtx = createContext<Ctx>({ me: null, refresh: async () => {}, openPaywall: () => {} });
export const useStudio = () => useContext(StudioCtx);

export function StudioProvider({ children, initial }: { children: React.ReactNode; initial: Me }) {
  const [me, setMe] = useState<Me | null>(initial);
  const [paywall, setPaywall] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setMe(await api<Me>("/api/me"));
    } catch {}
  }, []);
  useEffect(() => {
    identify(initial.id, { plan: initial.plan });
  }, [initial.id, initial.plan]);
  return (
    <StudioCtx.Provider value={{ me, refresh, openPaywall: () => setPaywall(true) }}>
      {children}
      <PaywallModal open={paywall} onClose={() => setPaywall(false)} plan={me?.plan ?? "free"} />
    </StudioCtx.Provider>
  );
}
