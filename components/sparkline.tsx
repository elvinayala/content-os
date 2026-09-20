// Minigráfico SVG liviano (sin dependencias). Dibuja una línea suave a partir de
// una serie de números. El color se controla por `stroke` (variable CSS o color).

interface SparklineProps {
  data: number[];
  stroke?: string;
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  stroke = "var(--primary)",
  width = 120,
  height = 36,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 2;
  const stepX = (width - pad * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (height - pad * 2) * (1 - (v - min) / span);
    return [x, y] as const;
  });

  const d = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  // Área de relleno bajo la línea.
  const area =
    `M${points[0][0].toFixed(1)},${height}` +
    points.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(" ") +
    `L${points[points.length - 1][0].toFixed(1)},${height}Z`;

  const gid = `spark-${data.join("-").slice(0, 16)}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} stroke="none" />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
