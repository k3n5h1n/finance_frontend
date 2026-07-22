import "./reorder-buttons.css";

export default function ReorderButtons({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  disabled = false,
  className = "",
}) {
  if (!canMoveUp && !canMoveDown) return null;

  return (
    <div
      className={`btn-group btn-group-sm reorder-buttons ${className}`.trim()}
      role="group"
      aria-label="Reorder"
    >
      <button
        type="button"
        className="btn btn-outline-secondary bi-chevron-up"
        title="Move up"
        aria-label="Move up"
        disabled={!canMoveUp || disabled}
        onClick={onMoveUp}
      ></button>
      <button
        type="button"
        className="btn btn-outline-secondary bi-chevron-down"
        title="Move down"
        aria-label="Move down"
        disabled={!canMoveDown || disabled}
        onClick={onMoveDown}
      ></button>
    </div>
  );
}
