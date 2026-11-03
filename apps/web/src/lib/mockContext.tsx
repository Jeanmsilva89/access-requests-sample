import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiBase } from "./api";

type MockContextValue = {
  isMock: boolean;
  setIsMock: (value: boolean) => void;
  noteMock: (value: boolean) => void;
};

const MockContext = createContext<MockContextValue | null>(null);

export function MockProvider({ children }: { children: ReactNode }) {
  const [isMock, setIsMock] = useState(false);
  const noteMock = useCallback((value: boolean) => {
    if (value) setIsMock(true);
  }, []);

  // Probe once so the sandbox banner appears on every route, even before page data loads.
  useEffect(() => {
    if (!apiBase) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiBase.replace(/\/$/, "")}/health`);
        if (!cancelled && res.headers.get("X-Mock") === "true") {
          setIsMock(true);
        }
      } catch {
        // ignore probe failures; pages will surface API errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ isMock, setIsMock, noteMock }),
    [isMock, noteMock],
  );
  return <MockContext.Provider value={value}>{children}</MockContext.Provider>;
}

export function useMockFlag() {
  const ctx = useContext(MockContext);
  if (!ctx) throw new Error("useMockFlag must be used within MockProvider");
  return ctx;
}
