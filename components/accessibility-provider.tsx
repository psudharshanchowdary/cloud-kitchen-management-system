"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { updateUserPreferencesAction } from "@/actions/settings";
import { UserPreferences } from "@/types";
import { toast } from "sonner";

interface AccessibilityContextType {
  textSize: "small" | "normal" | "medium" | "large" | "extra-large";
  density: "compact" | "normal" | "comfortable";
  highContrast: boolean;
  scaleFactor: number;
  setTextSize: (size: "small" | "normal" | "medium" | "large" | "extra-large") => void;
  setDensity: (density: "compact" | "normal" | "comfortable") => void;
  setHighContrast: (highContrast: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const TEXT_SIZE_MULTIPLIERS = {
  "small": 0.9,
  "normal": 1.0,
  "medium": 1.1,
  "large": 1.25,
  "extra-large": 1.4,
};

export const DENSITY_MULTIPLIERS = {
  "compact": 0.95,
  "normal": 1.0,
  "comfortable": 1.15,
};

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  // Initialize from localStorage or fallback
  const [textSize, setTextSizeState] = useState<"small" | "normal" | "medium" | "large" | "extra-large">("normal");
  const [density, setDensityState] = useState<"compact" | "normal" | "comfortable">("normal");
  const [highContrast, setHighContrastState] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Load initial settings
  useEffect(() => {
    setMounted(true);
    
    // 1. Try user object preferences first (from database/auth store)
    if (user?.preferences) {
      setTextSizeState(user.preferences.textSize || "normal");
      setDensityState(user.preferences.density || "normal");
      setHighContrastState(!!user.preferences.highContrast);
      return;
    }

    // 2. Fallback to localStorage
    try {
      const stored = localStorage.getItem("accessibility-preferences");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.textSize) setTextSizeState(parsed.textSize);
        if (parsed.density) setDensityState(parsed.density);
        if (parsed.highContrast !== undefined) setHighContrastState(parsed.highContrast);
      }
    } catch (e) {
      console.error("Failed to load accessibility preferences from localStorage", e);
    }
  }, [user?.id]); // Reload if user ID changes (different user logs in)

  // Apply classes and font-size dynamically
  useEffect(() => {
    if (!mounted) return;

    const docEl = document.documentElement;

    // Apply scale multiplier
    const tMult = TEXT_SIZE_MULTIPLIERS[textSize] || 1.0;
    const dMult = DENSITY_MULTIPLIERS[density] || 1.0;
    const effectiveFontSize = 16 * tMult * dMult;
    
    docEl.style.fontSize = `${effectiveFontSize}px`;

    // Apply high contrast class
    if (highContrast) {
      docEl.classList.add("high-contrast");
    } else {
      docEl.classList.remove("high-contrast");
    }

    // Apply density classes
    docEl.classList.remove("compact-view", "comfortable-view");
    if (density === "comfortable") {
      docEl.classList.add("comfortable-view");
    } else if (density === "compact") {
      docEl.classList.add("compact-view");
    }

    // Save to localStorage
    try {
      localStorage.setItem(
        "accessibility-preferences",
        JSON.stringify({ textSize, density, highContrast })
      );
    } catch (e) {
      console.error(e);
    }
  }, [textSize, density, highContrast, mounted]);

  // Sync preferences with database helper
  const syncPreferences = async (newPrefs: UserPreferences) => {
    if (!user) return;
    
    try {
      const response = await updateUserPreferencesAction(user.id, newPrefs);
      if (response.success && response.user) {
        setUser(response.user); // Update auth store user profile
      }
    } catch (error) {
      console.error("Failed to sync accessibility preferences to database", error);
    }
  };

  const setTextSize = (size: "small" | "normal" | "medium" | "large" | "extra-large") => {
    setTextSizeState(size);
    syncPreferences({ textSize: size, density, highContrast });
  };

  const setDensity = (newDensity: "compact" | "normal" | "comfortable") => {
    setDensityState(newDensity);
    syncPreferences({ textSize, density: newDensity, highContrast });
  };

  const setHighContrast = (newHighContrast: boolean) => {
    setHighContrastState(newHighContrast);
    syncPreferences({ textSize, density, highContrast: newHighContrast });
  };

  const tMult = TEXT_SIZE_MULTIPLIERS[textSize] || 1.0;
  const dMult = DENSITY_MULTIPLIERS[density] || 1.0;
  const scaleFactor = tMult * dMult;

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        density,
        highContrast,
        scaleFactor,
        setTextSize,
        setDensity,
        setHighContrast,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}
