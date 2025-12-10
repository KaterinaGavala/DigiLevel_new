export default function Progress({ total, active }) {
  return (
    <div className="progress">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={i < active ? "active" : ""}></div>
      ))}
    </div>
  );
}
