import { useState, useEffect } from "react";
import { useNavigate,useSearchParams  } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar.jsx";

export default function Survey() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = searchParams.get("edit") === "1";

  const [form, setForm] = useState({
    education: "",
    profession: "",
    experience: "",
    workType: "",
    age: "",
    selfAssessment: "",
    digitalFrequency: "",
    mainTools: "",
  });

  const [message, setMessage] = useState("");

  // 🧠 Prefill if user already has data (from localStorage)
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
      if (!isEdit && savedUser?.survey && Object.keys(savedUser.survey).length > 0) {
    navigate("/quiz-selection");
    return;
    }
    if (savedUser?.survey) {
      setForm({
        education: savedUser.survey.education || "",
        profession: savedUser.survey.profession || "",
        experience: savedUser.survey.experience || "",
        workType: savedUser.survey.workType || "",
        age: savedUser.survey.age || "",
        selfAssessment: savedUser.survey.selfAssessment || "",
        digitalFrequency: savedUser.survey.digitalFrequency || "",
        mainTools: savedUser.survey.mainTools || "",
      });
    }
  }, [navigate, isEdit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/survey", form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // update local user
      const updatedUser = { ...JSON.parse(localStorage.getItem("user")), survey: form };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setMessage("✅ Τα στοιχεία αποθηκεύτηκαν!");
      setTimeout(() => navigate("/quiz"), 1000);
    } catch (err) {
      console.error(err);
      setMessage("❌ Σφάλμα κατά την αποθήκευση.");
    }
  };

  return (
      <>
          <Navbar />
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0f2fe, #ffffff)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "500px",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <h2 style={{ textAlign: "center", fontWeight: "bold", color: "#1e3a8a" }}>
          Προσωπικό Ερωτηματολόγιο
        </h2>

        {/* ---------- Υποχρεωτικά Πεδία ---------- */}
        <label>
          Επίπεδο εκπαίδευσης *
          <select
            name="education"
            value={form.education}
            onChange={handleChange}
            required
            style={selectStyle}
          >
            <option value="">Επιλέξτε...</option>
            <option value="Δευτεροβάθμια">Δευτεροβάθμια</option>
            <option value="Πανεπιστήμιο">Πανεπιστήμιο</option>
            <option value="Μεταπτυχιακό">Μεταπτυχιακό</option>
            <option value="Διδακτορικό">Διδακτορικό</option>
          </select>
        </label>

        <label>
          Επάγγελμα / Τομέας εργασίας *
          <select
            name="profession"
            value={form.profession}
            onChange={handleChange}
            required
            style={selectStyle}
          >
            <option value="">Επιλέξτε...</option>
            <option value="Εκπαίδευση">Εκπαίδευση</option>
            <option value="Πληροφορική">Πληροφορική</option>
            <option value="Διοίκηση">Διοίκηση</option>
            <option value="Υγεία">Υγεία</option>
            <option value="Άλλο">Άλλο</option>
          </select>
        </label>

        <label>
          Έτη επαγγελματικής εμπειρίας *
          <select
            name="experience"
            value={form.experience}
            onChange={handleChange}
            required
            style={selectStyle}
          >
            <option value="">Επιλέξτε...</option>
            <option value="0-2">0–2</option>
            <option value="3-5">3–5</option>
            <option value="6-10">6–10</option>
            <option value=">10">&gt;10</option>
          </select>
        </label>

        <label>
          Είδος εργασίας *
          <select
            name="workType"
            value={form.workType}
            onChange={handleChange}
            required
            style={selectStyle}
          >
            <option value="">Επιλέξτε...</option>
            <option value="Δημόσιος τομέας">Δημόσιος τομέας</option>
            <option value="Ιδιωτικός τομέας">Ιδιωτικός τομέας</option>
            <option value="Ελεύθερος επαγγελματίας">Ελεύθερος επαγγελματίας</option>
            <option value="Φοιτητής">Φοιτητής</option>
          </select>
        </label>

        <label>
          Ηλικία *
          <input
            type="number"
            name="age"
            placeholder="π.χ. 25"
            value={form.age}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </label>

        {/* ---------- Προαιρετικά Πεδία ---------- */}
        <h3 style={{ color: "#1e3a8a", marginTop: "1rem" }}>Προαιρετικά:</h3>

        <label>
          Αυτοαξιολόγηση ψηφιακής επάρκειας (1–5 ή Αρχάριος–Προχωρημένος)
          <select
            name="selfAssessment"
            value={form.selfAssessment}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="">Επιλέξτε...</option>
            <option value="1 - Αρχάριος">1 - Αρχάριος</option>
            <option value="2 - Βασικό επίπεδο">2 - Βασικό επίπεδο</option>
            <option value="3 - Μέτριο επίπεδο">3 - Μέτριο επίπεδο</option>
            <option value="4 - Καλό επίπεδο">4 - Καλό επίπεδο</option>
            <option value="5 - Προχωρημένος">5 - Προχωρημένος</option>
          </select>
        </label>

        <label>
          Συχνότητα χρήσης ψηφιακών εργαλείων
          <select
            name="digitalFrequency"
            value={form.digitalFrequency}
            onChange={handleChange}
            style={selectStyle}
          >
            <option value="">Επιλέξτε...</option>
            <option value="Καθημερινά">Καθημερινά</option>
            <option value="Μερικές φορές την εβδομάδα">Μερικές φορές την εβδομάδα</option>
            <option value="Σπάνια">Σπάνια</option>
            <option value="Μόνο για εργασία">Μόνο για εργασία</option>
          </select>
        </label>

        <label>
          Κύρια ψηφιακά εργαλεία που χρησιμοποιείτε
          <input
            type="text"
            name="mainTools"
            placeholder="π.χ. MS Office, Google Workspace, social media..."
            value={form.mainTools}
            onChange={handleChange}
            style={inputStyle}
          />
        </label>

        <button type="submit" style={buttonStyle}>
          Αποθήκευση & Συνέχεια →
        </button>

        {message && (
          <p style={{ textAlign: "center", color: "#374151", fontSize: "0.9rem" }}>
            {message}
          </p>
        )}
      </form>
    </div>
  </>  
  );
}

const selectStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  marginTop: "5px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  marginTop: "5px",
};

const buttonStyle = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "12px",
  borderRadius: "10px",
  fontSize: "1rem",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "0.2s",
};
