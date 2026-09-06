import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { HAZARD_COLORS } from '../../utils/constants';

/**
 * HazardDonut — Donut chart showing active hazard zone counts by type.
 * 
 * Uses Recharts PieChart with custom dark-themed tooltip.
 * Colors match the hazard-aware palette from the design system.
 */

const COLORS = [
  HAZARD_COLORS.FLOOD.primary,
  HAZARD_COLORS.EARTHQUAKE.primary,
  HAZARD_COLORS.LANDSLIDE.primary,
  HAZARD_COLORS.AIR_QUALITY.primary,
];

/** Custom tooltip for dark theme */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel px-3 py-2">
      <p className="text-xs font-medium" style={{ color: payload[0].payload.color }}>
        {payload[0].name}: {payload[0].value}
      </p>
    </div>
  );
}

export default function HazardDonut({ data = [] }) {
  // Transform API data to chart format
  const chartData = data.length > 0
    ? data.map(([type, count], i) => ({
        name: type,
        value: Number(count),
        color: COLORS[i % COLORS.length],
      }))
    : [
        { name: 'Floods', value: 3, color: COLORS[0] },
        { name: 'Earthquakes', value: 1, color: COLORS[1] },
        { name: 'Landslides', value: 2, color: COLORS[2] },
        { name: 'Air Quality', value: 1, color: COLORS[3] },
      ];

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="chart-container" style={{ height: '180px' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {total}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Active
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
