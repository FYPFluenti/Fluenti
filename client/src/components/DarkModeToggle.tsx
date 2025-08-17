import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.theme === "dark" ||
        (!("theme" in localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={isDark}
        onChange={() => setIsDark(!isDark)}
        className="sr-only"
        aria-label="Toggle dark mode"
        title="Toggle dark mode"
      />
      <div className="relative !w-16 !h-9 bg-gray-300 dark:bg-gray-600 rounded-full transition">
        <div
          className={`absolute top-1 left-1 !w-7 !h-7 rounded-full bg-white transition-transform ${
            isDark ? "translate-x-7" : ""
          }`}
        />
      </div>
    </label>
  );
}
