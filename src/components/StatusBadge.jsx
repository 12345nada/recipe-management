function StatusBadge({
  status,
  displayLabel,
}) {
  const className =
    status
      .toLowerCase()
      .replaceAll(" ", "-");

  return (
    <span
      className={`status-badge status-${className}`}
    >
      {displayLabel || status}
    </span>
  );
}

export default StatusBadge;