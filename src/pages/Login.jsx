import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // 👈 hook for navigation

  const toggle = () => {
    setIsSignup(!isSignup);
    setForm({ name: "", email: "", password: "" });
    setMessage("");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("Loading...");

    try {
      const url = isSignup
        ? "http://localhost:5000/auth/signup"
        : "http://localhost:5000/auth/login";

      const body = isSignup
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = await axios.post(url, body);

      setMessage("✅ Success!");
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      // ------------- AI Warm Up ------------- //
try {
  await axios.post(
    "http://localhost:5000/ai/warmup",
    {},
    { headers: { Authorization: `Bearer ${res.data.token}` } }
  );
} catch (e) {
  console.warn("AI warmup failed — continuing anyway.");
}


      // 👇 redirect after login/signup
    const survey = res.data.user.survey;
    if (survey && Object.keys(survey).length > 0) {
      // user already has survey -> skip to quiz or dashboard
      navigate("/results");
    } else {
      // new user -> go fill survey
      navigate("/survey");
    }
    } catch (err) {
      setMessage(
        err.response?.data?.message || "❌ Something went wrong. Try again."
      );
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Left panel */}
      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #2563eb, #1e40af)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem",
        }}
      >
        <img src="/DigiLevel_.png" alt="DigiLevel Logo" style={{ width: 120, marginBottom: 20 }} />
        <h1 style={{ fontSize: "2rem", fontWeight: "bold" }}>DigiLevel</h1>
        <p style={{ maxWidth: 300, textAlign: "center", marginTop: 10 }}>
          Adaptive quiz system for digital skills assessment (DigComp-based)
        </p>
      </div>

      {/* Right panel */}
      <div
        style={{
          flex: 1,
          background: "#fff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "2rem",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            maxWidth: 350,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
            {isSignup ? "Create Account" : "Login"}
          </h2>

          {isSignup && (
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <button type="submit" style={buttonStyle}>
            {isSignup ? "Sign Up" : "Login"}
          </button>

          <p style={{ fontSize: "0.9rem" }}>
            {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
            <span
              onClick={toggle}
              style={{ color: "#2563eb", cursor: "pointer", fontWeight: "bold" }}
            >
              {isSignup ? "Login" : "Sign Up"}
            </span>
          </p>

          {message && <p style={{ fontSize: "0.9rem", color: "#555" }}>{message}</p>}
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px 14px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontSize: "1rem",
};

const buttonStyle = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "12px",
  borderRadius: "8px",
  fontSize: "1rem",
  cursor: "pointer",
};
