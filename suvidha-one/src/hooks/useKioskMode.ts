"use client";

import { useState, useCallback, useEffect } from "react";

export interface KioskModeOptions {
  autoFullscreen?: boolean;
  disableScreensaver?: boolean;
  wakeLock?: boolean;
}

/**
 * Hook for kiosk mode functionality
 * - Fullscreen API
 * - Wake Lock API (prevent screen sleep)
 * - Keyboard handling (disable F11, Alt+F4, etc.)
 */
export function useKioskMode(options: KioskModeOptions = {}) {
  const {
    autoFullscreen = true,
    disableScreensaver = true,
    wakeLock = true,
  } = options;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enter fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      setError("Fullscreen not supported");
      console.error("Fullscreen error:", err);
    }
  }, []);

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      setError("Failed to exit fullscreen");
      console.error("Exit fullscreen error:", err);
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  // Request wake lock (prevent screen sleep)
  const requestWakeLock = useCallback(async () => {
    if (!wakeLock || !("wakeLock" in navigator)) {
      return;
    }

    try {
      const wakeLockSentinel = await (navigator as any).wakeLock.request("screen");
      setWakeLockActive(true);

      wakeLockSentinel.addEventListener("release", () => {
        setWakeLockActive(false);
      });
    } catch (err) {
      setError("Wake Lock not supported");
      console.error("Wake Lock error:", err);
    }
  }, [wakeLock]);

  // Release wake lock
  const releaseWakeLock = useCallback(() => {
    if ("wakeLock" in navigator && wakeLockActive) {
      (navigator as any).wakeLock.release?.();
      setWakeLockActive(false);
    }
  }, [wakeLockActive]);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Auto-enter fullscreen on mount
  useEffect(() => {
    if (autoFullscreen) {
      enterFullscreen();
    }
  }, [autoFullscreen, enterFullscreen]);

  // Request wake lock on mount
  useEffect(() => {
    if (wakeLock) {
      requestWakeLock();
    }

    // Re-request wake lock when visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && wakeLock) {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseWakeLock();
    };
  }, [wakeLock, requestWakeLock, releaseWakeLock]);

  // Prevent certain keyboard shortcuts in kiosk mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F11, Alt+F4, Alt+Tab, Ctrl+W, etc.
      if (
        e.key === "F11" ||
        (e.altKey && e.key === "F4") ||
        (e.ctrlKey && e.key === "w") ||
        (e.ctrlKey && e.key === "q")
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return {
    isFullscreen,
    wakeLockActive,
    error,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    requestWakeLock,
    releaseWakeLock,
  };
}

/**
 * Hook for offline detection and localStorage caching
 */
export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        setLastSync(new Date());
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  const setItem = useCallback((key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error("localStorage error:", err);
    }
  }, []);

  const getItem = useCallback(<T,>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (err) {
      console.error("localStorage error:", err);
      return null;
    }
  }, []);

  const removeItem = useCallback((key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error("localStorage error:", err);
    }
  }, []);

  return {
    isOnline,
    lastSync,
    setItem,
    getItem,
    removeItem,
  };
}
