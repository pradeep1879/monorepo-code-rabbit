"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  attribute?: "class" | `data-${string}`;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
};

const ThemeProviderContext = React.createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => null,
  resolvedTheme: "light",
});

const storageKey = "theme";

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  attribute = "class",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

  const applyTheme = React.useCallback(
    (nextTheme: Theme) => {
      const root = document.documentElement;
      const resolved = nextTheme === "system" && enableSystem ? getSystemTheme() : nextTheme;
      const themeToApply = resolved === "system" ? "light" : resolved;

      if (attribute === "class") {
        root.classList.remove("light", "dark");
        root.classList.add(themeToApply);
      } else {
        root.setAttribute(attribute, themeToApply);
      }

      root.style.colorScheme = themeToApply;
      setResolvedTheme(themeToApply);
    },
    [attribute, enableSystem]
  );

  React.useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    const initialTheme = storedTheme || defaultTheme;

    setThemeState(initialTheme);
    applyTheme(initialTheme);
  }, [applyTheme, defaultTheme]);

  React.useEffect(() => {
    if (theme !== "system" || !enableSystem) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");

    media.addEventListener("change", handleChange);

    return () => media.removeEventListener("change", handleChange);
  }, [applyTheme, enableSystem, theme]);

  const setTheme = React.useCallback(
    (nextTheme: Theme) => {
      localStorage.setItem(storageKey, nextTheme);
      setThemeState(nextTheme);
      applyTheme(nextTheme);
    },
    [applyTheme]
  );

  const value = React.useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [resolvedTheme, setTheme, theme]
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => React.useContext(ThemeProviderContext);
