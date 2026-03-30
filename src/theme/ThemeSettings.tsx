import { useThemeSettings } from "./theme-provider";

const presetColors = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

export const ThemeSettings = () => {
  const {
    themeMode,
    resolvedTheme,
    accentColor,
    setThemeMode,
    setAccentColor,
  } = useThemeSettings();

  return (
    <div className="card" style={{ display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, marginBottom: 8, fontSize: "16px" }}>
          Appearance
        </h2>
        <p style={{ margin: 0, opacity: 0.7, fontSize: "13px" }}>
          Current theme: <b>{resolvedTheme}</b>
        </p>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontSize: "13px" }}>Theme mode</label>
        <select
          className="select"
          value={themeMode}
          onChange={(e) =>
            setThemeMode(e.target.value as "light" | "dark" | "system")
          }
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontSize: "13px" }}>Accent color</label>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setAccentColor(color)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border:
                  accentColor === color
                    ? "2px solid var(--text)"
                    : "1px solid var(--border)",
                background: color,
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        <input
          type="color"
          value={accentColor}
          onChange={(e) => setAccentColor(e.target.value)}
          style={{
            width: 56,
            height: 36,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 0,
          }}
        />

        <input
          className="input"
          value={accentColor}
          onChange={(e) => setAccentColor(e.target.value)}
          placeholder="#8b5cf6"
        />
      </div>

      <button className="accent-btn">Preview button</button>
    </div>
  );
};
