import { useThemeSettings, type ThemeMode } from "./theme-provider";

export const ThemeSettings = () => {
  const { themeMode, resolvedTheme, setThemeMode } = useThemeSettings();

  return (
    <div className="card" style={{ display: "grid", gap: 12 }}>
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
          onChange={(e) => setThemeMode(e.target.value as ThemeMode)}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    </div>
  );
};
