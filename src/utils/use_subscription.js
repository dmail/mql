import { useEffect, useRef, useState } from "preact/hooks";

export const useSubscription = (get, subscribe) => {
  const [globalVolume, globalVolumeSetter] = useState(get());
  const cleanupRef = useRef(null);
  if (cleanupRef.current === null) {
    const subscribeReturnValue = subscribe(() => {
      globalVolumeSetter(get());
    });
    if (typeof subscribeReturnValue === "function") {
      cleanupRef.current = subscribeReturnValue;
    } else {
      cleanupRef.current = true;
    }
  }
  useEffect(() => {
    return () => {
      const cleanup = cleanupRef.current;
      if (typeof cleanup === "function") {
        cleanup();
      }
      cleanupRef.current = null;
    };
  }, []);
  return globalVolume;
};
