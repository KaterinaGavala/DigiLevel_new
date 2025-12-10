export default function QuestionOption({ label, checked, onChange }) {
  return (
    <label className={`option ${checked ? "checked" : ""}`}>
      <input
        type="radio"
        name="q"
        checked={checked}
        onChange={onChange}
        style={{ accentColor: "#2563eb" }}
      />
      {label}
    </label>
  );
}
