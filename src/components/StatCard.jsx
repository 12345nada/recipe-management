function StatCard({
  icon,
  title,
  value,
  subtitle,
  className = "",
  onClick,
}) {
  return (
    <button
      type="button"
      className={`stat-card ${className}`}
      onClick={onClick}
    >
      <div className="stat-card-icon">
        {icon}
      </div>

      <div className="stat-card-content">
        <span className="stat-card-title">
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {subtitle}
        </small>
      </div>
    </button>
  );
}

export default StatCard;