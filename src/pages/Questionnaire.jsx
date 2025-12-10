import { useState } from "react";
import Progress from "../components/Progress.jsx";
import QuestionOption from "../components/QuestionOption.jsx";

export default function Questionnaire() {
  const TOTAL = 6;
  const [step, setStep] = useState(2);
  const [value, setValue] = useState("");

  const options = [
    "A place where people don’t question my authority.",
    "Wherever my best friends are, that’s where I want to be.",
    "One where everyone pushes themselves to do their best every single day.",
    "One that’s organized, structured and has workplace policies set.",
    "A place where everyone knows I’m the boss.",
    "A place where I’m the CEO.",
  ];

  return (
    <div className="card">
      <Progress total={TOTAL} active={step} />

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#555", marginBottom: "0.5rem" }}>
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#555" }}
        >
          ← Previous
        </button>
        <span>QUESTION {step} / {TOTAL}</span>
        <div />
      </div>

      <h1>What is your ideal workplace?</h1>

      <div>
        {options.map((opt, i) => (
          <QuestionOption
            key={i}
            label={opt}
            checked={value === opt}
            onChange={() => setValue(opt)}
          />
        ))}
      </div>

      <div style={{ textAlign: "center" }}>
        <button
          className="primary"
          onClick={() => setStep(Math.min(TOTAL, step + 1))}
        >
          Next Question →
        </button>
      </div>
    </div>
  );
}
