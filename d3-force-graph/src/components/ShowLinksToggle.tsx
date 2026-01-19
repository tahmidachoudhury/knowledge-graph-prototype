import * as React from "react";

interface ShowLinksToggleProps {
    showLinks: boolean;
    onToggle: () => void;
    className?: string;
}

export function ShowLinksToggle({
    showLinks,
    onToggle,
    className,
}: ShowLinksToggleProps) {
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
        bg-white text-slate-800 border-slate-800
        dark:bg-slate-900 dark:text-slate-50 dark:border-slate-50
        hover:bg-slate-50 dark:hover:bg-slate-800
      `}
        >
            {showLinks ? "🔗 Hide Links" : "🔗 Show Links"}
        </button>
    );
}
