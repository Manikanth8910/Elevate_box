import { cn } from './utils';

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  maxBars?: number;
}

export function BarChart({ data, height = 200, maxBars = 12 }: BarChartProps) {
  const chartData = data.slice(0, maxBars);
  const maxVal = Math.max(...chartData.map((d) => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-1.5" style={{ height }}>
      {chartData.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end justify-center">
            <div
              className={cn('w-full max-w-[32px] rounded-t-md transition-all duration-500 hover:opacity-80', d.color ?? 'bg-slate-800')}
              style={{ height: `${(d.value / maxVal) * 100}%`, minHeight: d.value > 0 ? '4px' : '0' }}
              title={`${d.label}: ${d.value}`}
            />
          </div>
          <span className="text-[10px] font-medium text-slate-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  fill?: string;
}

export function LineChart({ data, height = 200, color = '#0f172a', fill = 'rgba(15,23,42,0.08)' }: LineChartProps) {
  if (data.length === 0) return <div style={{ height }} />;
  const width = 600;
  const padding = { top: 10, right: 10, bottom: 24, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = 0;
  const stepX = chartW / Math.max(data.length - 1, 1);
  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + chartH - ((d.value - minVal) / (maxVal - minVal)) * chartH,
  ...d,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {gridLines.map((g, i) => (
        <line
          key={i}
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + chartH * g}
          y2={padding.top + chartH * g}
          stroke="#f1f5f9"
          strokeWidth={1}
        />
      ))}
      <path d={areaD} fill={fill} />
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill="white" stroke={color} strokeWidth={2} />
          <text x={p.x} y={height - 6} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9 }}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, size = 160, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const radius = size / 2 - 12;
  const innerRadius = radius * 0.62;
  const cx = size / 2;
  const cy = size / 2;
  let angle = -Math.PI / 2;

  const arcs = data.map((d) => {
    const sliceAngle = (d.value / total) * Math.PI * 2;
    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle + sliceAngle) * radius;
    const y2 = cy + Math.sin(angle + sliceAngle) * radius;
    const x3 = cx + Math.cos(angle + sliceAngle) * innerRadius;
    const y3 = cy + Math.sin(angle + sliceAngle) * innerRadius;
    const x4 = cx + Math.cos(angle) * innerRadius;
    const y4 = cy + Math.sin(angle) * innerRadius;
    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    angle += sliceAngle;
    return { path, ...d };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a, i) => (
          <path key={i} d={a.path} fill={a.color} className="hover:opacity-80 transition-opacity" />
        ))}
        {centerValue && (
          <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-900 font-bold" style={{ fontSize: 22 }}>
            {centerValue}
          </text>
        )}
        {centerLabel && (
          <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 10 }}>
            {centerLabel}
          </text>
        )}
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-slate-600">{d.label}</span>
            <span className="font-semibold text-slate-900">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function Sparkline({ data, color = '#0f172a', height = 32, width = 100 }: SparklineProps) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({ value, max = 100, size = 80, color = '#0ea5e9', label }: ProgressRingProps) {
  const pct = Math.min(value / max, 1);
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold text-slate-900">{Math.round(value)}{label === '%' ? '%' : ''}</span>
        {label && label !== '%' && <span className="text-[10px] text-slate-400">{label}</span>}
      </div>
    </div>
  );
}
