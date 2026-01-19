import * as React from "react";

type ThemeValue = "light" | "dark" | string; // flexible if your theme lib adds more

interface ThemeToggleProps {
    theme: ThemeValue;
    onToggle: () => void;
    className?: string; // so you can position it with Tailwind (absolute, top, right, etc.)
}

export function ThemeToggle({ theme, onToggle, className }: ThemeToggleProps) {
    const isLight = theme === "light";

    return (
        <button
            type="button"
            onClick={onToggle}
            className={`
        ${className ?? ""}
        inline-flex items-center justify-center
        rounded-md border
        px-4 py-2
        text-sm md:text-base font-semibold
        shadow-sm
        transition
        ${isLight
                    ? "bg-white text-slate-800 border-slate-800 hover:bg-slate-50"
                    : "bg-white-900 text-slate-50 border-slate-50 hover:bg-slate-800"}
      `}
        >
            {isLight ? "🌙 Dark" : "☀️ Light"}
        </button>
    );
}
