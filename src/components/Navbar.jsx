// src/components/Navbar.jsx
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const isActive = (pathPrefix) => location.pathname.startsWith(pathPrefix);

  const linkStyle = (active) => ({
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 14,
    cursor: "pointer",
    border: "none",
    background: active ? "rgba(37,99,235,0.08)" : "transparent",
    color: active ? "#1d4ed8" : "#4b5563",
  });

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background:
          "linear-gradient(135deg, rgba(239,246,255,0.98), rgba(248,250,252,0.98))",
        borderBottom: "1px solid #e5e7eb",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          maxWidth: 1150,
          margin: "0 auto",
          padding: "0.6rem 1.5rem",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* logo + title */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          onClick={() => navigate("/quiz-selection")}
        >
          <img src="/DigiLevel_.png" alt="DigiLevel" style={{ width: 34 }} />
          <span style={{ fontWeight: 600, fontSize: 18 }}>DigiLevel</span>
        </div>

        {/* center links */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginLeft: 24,
            flex: 1,
          }}
        >
          <button
            style={linkStyle(isActive("/quiz-selection") || isActive("/quiz"))}
            onClick={() => navigate("/quiz-selection")}
          >
             Quizes
          </button>

          <button
            style={linkStyle(isActive("/results"))}
            onClick={() => navigate("/results")}
          >
            Dashboard
          </button>

          <button
            style={linkStyle(isActive("/survey"))}
            onClick={() => navigate("/survey?edit=1")}
          >
            Προφίλ
          </button>
        </div>

        {/* right side: user + logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user && (
            <div style={{ textAlign: "right", fontSize: 13 }}>
              <div style={{ fontWeight: 500 }}>{user.name || "Χρήστης"}</div>
              <div style={{ color: "#6b7280" }}>{user.email}</div>
            </div>
          )}
          <button
            onClick={logout}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 13,
              background: "#ffffff",
              cursor: "pointer",
            }}
          >
            Αποσύνδεση
          </button>
        </div>
      </div>
    </nav>
  );
}
