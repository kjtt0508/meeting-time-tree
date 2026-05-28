import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Meeting Time Tree — 会議の記録を、プロジェクトの地図に変える。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景の装飾ノード */}
        {[
          { x: 80, y: 120, size: 48, opacity: 0.12 },
          { x: 260, y: 80, size: 36, opacity: 0.1 },
          { x: 900, y: 100, size: 44, opacity: 0.12 },
          { x: 1080, y: 200, size: 32, opacity: 0.1 },
          { x: 120, y: 480, size: 40, opacity: 0.1 },
          { x: 1020, y: 460, size: 36, opacity: 0.12 },
          { x: 600, y: 540, size: 28, opacity: 0.08 },
        ].map((n, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: n.x,
              top: n.y,
              width: n.size,
              height: n.size,
              borderRadius: 8,
              background: "#3b82f6",
              opacity: n.opacity,
            }}
          />
        ))}

        {/* 接続線の装飾 */}
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, opacity: 0.07 }}
          viewBox="0 0 1200 630"
        >
          <line x1="104" y1="144" x2="278" y2="98" stroke="#60a5fa" strokeWidth="2" />
          <line x1="278" y1="98" x2="922" y2="122" stroke="#60a5fa" strokeWidth="2" />
          <line x1="922" y1="122" x2="1096" y2="216" stroke="#60a5fa" strokeWidth="2" />
          <line x1="140" y1="500" x2="1038" y2="478" stroke="#60a5fa" strokeWidth="2" />
        </svg>

        {/* メインコンテンツ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            zIndex: 10,
          }}
        >
          {/* ロゴアイコン */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              boxShadow: "0 0 40px rgba(99, 102, 241, 0.4)",
            }}
          >
            🌿
          </div>

          {/* タイトル */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#f8fafc",
              letterSpacing: "-1px",
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            Meeting Time Tree
          </div>

          {/* サブタイトル */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "#94a3b8",
              textAlign: "center",
              letterSpacing: "0.02em",
            }}
          >
            会議の記録を、プロジェクトの地図に変える。
          </div>

          {/* プラン バッジ */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 8,
            }}
          >
            {["Free", "Pro ¥980/月", "Team ¥2,980/月"].map((label, i) => (
              <div
                key={i}
                style={{
                  padding: "6px 16px",
                  borderRadius: 999,
                  background: i === 0 ? "rgba(51,65,85,0.8)" : i === 1 ? "rgba(37,99,235,0.25)" : "rgba(124,58,237,0.25)",
                  border: `1px solid ${i === 0 ? "#334155" : i === 1 ? "#3b82f6" : "#7c3aed"}`,
                  color: i === 0 ? "#94a3b8" : i === 1 ? "#60a5fa" : "#a78bfa",
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            right: 48,
            fontSize: 18,
            color: "#475569",
            fontWeight: 500,
          }}
        >
          meeting-timetree.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
