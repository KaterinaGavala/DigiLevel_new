import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

const DOMAINS = {
  "info-data": {
    title: "Πληροφορίες & Δεδομένα",
    subtitle: "Information & Data Literacy",
  },
  communication: {
    title: "Επικοινωνία & Συνεργασία",
    subtitle: "Communication & Collaboration",
  },
  content: {
    title: "Δημιουργία Ψηφιακού Περιεχομένου",
    subtitle: "Digital Content Creation",
  },
  safety: {
    title: "Ασφάλεια",
    subtitle: "Safety",
  },
  "problem-solving": {
    title: "Επίλυση Προβλημάτων",
    subtitle: "Problem Solving",
  },
};

export default function Results() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const fetchResults = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get("http://localhost:5000/results", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setResults(res.data.results || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Πρόβλημα κατά τη φόρτωση των αποτελεσμάτων."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [token, navigate]);

  // ---- derived metrics ----
  const hasResults = results.length > 0;

  // latest result per domain
  const latestByDomain = {};
  const attemptsByDomain = {};
  let totalCorrect = 0;
  let totalQuestions = 0;

  results.forEach((r) => {
    const key = r.domain;
    attemptsByDomain[key] = (attemptsByDomain[key] || 0) + 1;

    if (
      !latestByDomain[key] ||
      new Date(r.createdAt) > new Date(latestByDomain[key].createdAt)
    ) {
      latestByDomain[key] = r;
    }

    totalCorrect += r.correctAnswers || 0;
    totalQuestions += r.total || 0;
  });

  const domainKeys = Object.keys(DOMAINS);

  const avgLevel =
    hasResults && Object.keys(latestByDomain).length > 0
      ? (
          Object.values(latestByDomain).reduce(
            (sum, r) => sum + (r.finalLevel || 1),
            0
          ) / Object.keys(latestByDomain).length
        ).toFixed(1)
      : "-";

  const overallSuccess =
    totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

  // find best domain by latest level
  let bestDomain = null;
  let bestLevel = -1;
  Object.entries(latestByDomain).forEach(([key, r]) => {
    if ((r.finalLevel || 0) > bestLevel) {
      bestLevel = r.finalLevel || 0;
      bestDomain = key;
    }
  });

  return (
     <>
     <Navbar />
    <div
  style={{
    minHeight: "100vh",
    padding: "1.5rem",
   background: "#eaf1fb",
  }}
>

      <div style={{ maxWidth: 1150, margin: "0 auto" }}>
        {/* header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <img src="/DigiLevel_.png" alt="DigiLevel" style={{ width: 40 }} />
          <h2 style={{ margin: 0 }}>Αποτελέσματα Quiz</h2>
          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={() => navigate("/quiz-selection")}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 999,
                padding: "6px 14px",
                background: "#fff",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ← Επιστροφή στην επιλογή Quiz
            </button>
          </div>
        </header>

        {loading && <div>Φόρτωση…</div>}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              padding: 12,
              borderRadius: 8,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        {!loading && !hasResults && !error && (
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 20,
              border: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            Δεν υπάρχουν ακόμη αποθηκευμένα αποτελέσματα.
          </div>
        )}

        {!loading && hasResults && !error && (
          <>
            {/* top KPI cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
                marginBottom: 18,
              }}
            >
              <KpiCard
                label="Συνολικός αριθμός Quiz"
                value={results.length}
                helper="Σύνολο προσπαθειών σε όλους τους τομείς"
              />
              <KpiCard
                label="Μέσο εκτιμώμενο επίπεδο"
                value={avgLevel}
                helper="Βασισμένο στο τελευταίο αποτέλεσμα ανά τομέα"
              />
              <KpiCard
                label="Συνολικό ποσοστό επιτυχίας"
                value={overallSuccess + "%"}
                helper={`${totalCorrect}/${totalQuestions} σωστές απαντήσεις`}
              />
              <KpiCard
                label="Καλύτερος τομέας"
                value={
                  bestDomain
                    ? DOMAINS[bestDomain]?.title || bestDomain
                    : "—"
                }
                helper={
                  bestLevel > -1 ? `Επίπεδο ${bestLevel}` : "Δεν υπάρχει ακόμη"
                }
              />
            </div>

            {/* main grid like dashboard */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr",
                gridAutoRows: "minmax(220px, auto)",
                gap: 16,
              }}
            >
              {/* Card 1: level per domain (bar chart style) */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 16,
                  border: "1px solid #e5e7eb",
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                  Επίπεδο ανά Τομέα
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                  Τελευταίο εκτιμώμενο επίπεδο ανά ψηφιακή ικανότητα (1–8).
                </p>

                <div style={{ marginTop: 10 }}>
                  {domainKeys.map((key) => {
                    const meta = DOMAINS[key];
                    const r = latestByDomain[key];
                    const level = r ? Math.max(1, Math.min(8, r.finalLevel || 1)) : 0;
                    const width = level > 0 ? `${(level / 8) * 100}%` : "0%";

                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 120,
                            fontSize: 13,
                            color: "#111827",
                          }}
                        >
                          {meta.title}
                        </div>
                        <div
                          style={{
                            flex: 1,
                            height: 8,
                            background: "#e5e7eb",
                            borderRadius: 999,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width,
                              height: "100%",
                              background: "#2563eb",
                              transition: "width 0.3s",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            width: 24,
                            textAlign: "right",
                            color: "#111827",
                          }}
                        >
                          {level > 0 ? level : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 2: attempts per domain */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 16,
                  border: "1px solid #e5e7eb",
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                  Πλήθος προσπαθειών ανά Τομέα
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                  Πόσα quiz έχεις ολοκληρώσει ανά θεματική.
                </p>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: 10,
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <th
                        style={{
                          textAlign: "left",
                          padding: "6px 4px",
                          fontWeight: 500,
                        }}
                      >
                        Τομέας
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          padding: "6px 4px",
                          fontWeight: 500,
                        }}
                      >
                        Προσπάθειες
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {domainKeys.map((key) => {
                      const meta = DOMAINS[key];
                      const count = attemptsByDomain[key] || 0;
                      return (
                        <tr key={key} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "6px 4px" }}>{meta.title}</td>
                          <td
                            style={{
                              padding: "6px 4px",
                              textAlign: "right",
                              color: count ? "#111827" : "#9ca3af",
                            }}
                          >
                            {count || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Card 3: overall success (simple donut-like feel) */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 16,
                  border: "1px solid #e5e7eb",
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                  Συνολική εικόνα επιτυχίας
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                  Ποσοστό σωστών απαντήσεων σε όλα τα quiz.
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginTop: 14,
                  }}
                >
                  {/* fake donut using two circles */}
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: "50%",
                      background: `conic-gradient(#22c55e 0 ${overallSuccess}%, #e5e7eb ${overallSuccess}% 100%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: "50%",
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        fontWeight: 600,
                        color: "#16a34a",
                      }}
                    >
                      {overallSuccess}%
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: "#4b5563" }}>
                    <p style={{ margin: "4px 0" }}>
                      Σωστές απαντήσεις:{" "}
                      <strong>
                        {totalCorrect}/{totalQuestions}
                      </strong>
                    </p>
                    <p style={{ margin: "4px 0" }}>
                      Όσο αυξάνεται το ποσοστό, τόσο πιο σταθερά
                      απαντάς σωστά σε όλες τις ενότητες.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4: recent quiz list */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 16,
                  border: "1px solid #e5e7eb",
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                  Τελευταία Quiz
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                  Οι πιο πρόσφατες προσπάθειες που ολοκλήρωσες.
                </p>

                <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                  {results
                    .slice() // copy
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt)
                    )
                    .slice(0, 5)
                    .map((r) => {
                      const meta = DOMAINS[r.domain] || { title: r.domain };
                      const level = Math.max(
                        1,
                        Math.min(8, r.finalLevel || 1)
                      );
                      return (
                        <div
                          key={r._id}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: 13,
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 500 }}>
                              {meta.title}
                            </div>
                            <div
                              style={{
                                color: "#6b7280",
                                fontSize: 12,
                              }}
                            >
                              {new Date(r.createdAt).toLocaleString("el-GR")}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div>Επίπεδο {level}</div>
                            <div
                              style={{
                                color: "#6b7280",
                                fontSize: 12,
                              }}
                            >
                              {r.correctAnswers}/{r.total} σωστές
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}

// small component for KPI cards
function KpiCard({ label, value, helper }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 14,
        border: "1px solid #e5e7eb",
        textAlign: "left",
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#9ca3af" }}>{helper}</div>
    </div>
  );
}
