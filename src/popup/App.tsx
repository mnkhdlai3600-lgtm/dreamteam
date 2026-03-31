import { useThemeSettings } from "../theme/theme-provider";
import { ThemeSettings } from "../theme/theme-settings";

function StatusCard() {
  const { resolvedTheme } = useThemeSettings();

  return (
    <div className="card">
      <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800 }}>Bolor AI</h1>

      <p style={{ marginTop: "10px", fontSize: "15px", lineHeight: 1.6 }}>
        Монгол галигийг Кирилл болгох, алдаа шалгах extension.
      </p>

      <div className="status-box">Status: Ready</div>

      <p className="meta-text">Active theme: {resolvedTheme}</p>
      <p className="meta-text">Hotkey: Option + Space</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <div
        style={{
          width: "340px",
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
