export default function StatCard({ label, value, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} role="button" tabIndex={0}>
      <span>{label}</span>
      <strong style={{ fontSize: '1.6rem' }}>{value}</strong>
    </div>
  );
}
