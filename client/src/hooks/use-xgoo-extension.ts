import { useEffect, useState } from "react";
import { pingExtension, isExtensionDomMarkerPresent } from "@/lib/partner-sync-client";

export function useXgooExtension() {
  const [installed, setInstalled] = useState(() => isExtensionDomMarkerPresent());
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (isExtensionDomMarkerPresent()) {
        if (!cancelled) {
          setInstalled(true);
          setChecking(false);
        }
        return;
      }

      const ok = await pingExtension();
      if (!cancelled) {
        setInstalled(ok);
        setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { installed, checking };
}
