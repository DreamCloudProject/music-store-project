import { useEffect } from "react";

export function usePopState(handler: () => void): void {
  useEffect(() => {
    globalThis.addEventListener("popstate", handler);
    return () => globalThis.removeEventListener("popstate", handler);
  }, [handler]);
}
