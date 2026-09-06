import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, Cell } from 'recharts';

/**
 * RiverLevelChart — Bar chart showing current water levels at monitoring stations.
 * 
 * Displays water level relative to danger level for each station.
 * Bars are color-coded: blue (safe), amber (warning), red (danger).
 */

/** Custom tooltip for dark theme */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="glass-panel px-3 py-2">
      <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
        {data.station} — {data.river}
      </p>
      <p className="text-xs" style={{ color: '#60A5FA' }}>
        Level: {data.level}m
      </p>
      <p className="text-xs" style={{ color: '#F59E0B' }}>
        Warning: {data.warning}m
      </p>
      <p className="text-xs" style={{ color: '#EF4444' }}>
        Danger: {data.danger}m
      </p>
    </div>
  );
}

export default function RiverLevelChart({ data = [] }) {
  // Sample data if no API data available yet
  const chartData = data.length > 0
    ? data
    : [
        { station: 'Guwahati', river: 'Brahmaputra', level: 48.2, danger: 49.68, warning: 48.68 },
        { station: 'Dibrugarh', river: 'Brahmaputra', level: 103.8, danger: 104.24, warning: 103.24 },
        { station: 'Silchar', river: 'Barak', level: 20.1, danger: 21.50, warning: 20.50 },
        { station: 'Tezpur', river: 'Brahmaputra', level: 63.8, danger: 65.35, warning: 64.35 },
        { station: 'Jorhat', river: 'Bhogdoi', level: 82.0, danger: 82.60, warning: 81.60 },
      ];

  // Normalize levels to percentages of danger level for visual comparison
  const normalizedData = chartData.map((d) => ({
    ...d,
    percentage: ((d.level / d.danger) * 100).toFixed(1),
    barColor:
      d.level >= d.danger ? '#EF4444' :
      d.level >= d.warning ? '#F59E0B' :
      '#3B82F6',
  }));

  return (
    <div className="chart-container" style={{ height: '200px' }}>
      <ResponsiveContainer>
        <BarChart data={normalizedData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          <XAxis
            dataKey="station"
            tick={{ fill: '#94A3B8', fontSize: 10 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#94A3B8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 110]}
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={100} stroke="#EF4444" strokeDasharray="3 3" label="" />
          <Bar
            dataKey="percentage"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          >
            {normalizedData.map((entry, index) => (
              <Cell key={index} fill={entry.barColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

