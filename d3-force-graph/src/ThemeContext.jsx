import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  // Update body class based on theme
  useEffect(() => {
    const themeClass =
      theme === "light" ? "theme-light-body" : "theme-dark-body";
    document.documentElement.className = themeClass;
    document.body.className = themeClass;
    return () => {
      document.documentElement.className = "";
      document.body.className = "";
    };
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
