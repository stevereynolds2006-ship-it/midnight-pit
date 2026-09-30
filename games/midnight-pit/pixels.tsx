export function PixelArt({
  rows,
  label,
}: {
  rows: readonly string[];
  label?: string;
}) {
  const height = rows.length || 1;
  const width = rows.reduce((max, line) => Math.max(max, line.length), 1);
  const path = rows
    .flatMap((line, y) =>
      [...line].flatMap((pixel, x) => (pixel === "#" ? [`M${x} ${y}h1v1h-1z`] : [])),
    )
    .join("");

  return (
    <svg
      className="pixel"
      viewBox={`0 0 ${width} ${height}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={path || `M0 0h${width}v${height}h-${width}z`} />
    </svg>
  );
}
