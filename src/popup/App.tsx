import { useThemeSettings } from "../theme/theme-provider";
import { ThemeSettings } from "../theme/theme-settings";

function StatusCard() {
  const { resolvedTheme } = useThemeSettings();

  return (
    <div className="card">
      <h1 style={{ margin: 0, fontSize: "20px" }}>Bolor AI</h1>

      <p style={{ marginTop: "10px", fontSize: "14px", lineHeight: 1.5 }}>
        Монгол галигийг Кирилл болгох, алдаа шалгах extension.
      </p>

      <div
        style={{
          marginTop: "12px",
          padding: "10px",
          borderRadius: "10px",
          background: "var(--card)",
          border: "1px solid var(--border)",
          fontSize: "14px",
        }}
      >
        Status: Ready
      </div>

      <p style={{ marginTop: "10px", fontSize: "12px", opacity: 0.7 }}>
        Active theme: {resolvedTheme}
      </p>

      <p style={{ marginTop: "6px", fontSize: "12px", opacity: 0.7 }}>
        Hotkey: Option + Space
      </p>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <div
        style={{
          width: "320px",
          display: "grid",
          gap: "12px",
        }}
      >
        <StatusCard />
        <ThemeSettings />
      </div>
    </div>
  );
}
