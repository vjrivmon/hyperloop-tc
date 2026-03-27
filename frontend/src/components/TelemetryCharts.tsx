import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { SimData, StateEvent } from '../types'

interface Props {
  history: SimData[]
  stateHistory: StateEvent[]
}

const STATE_COLORS: Record<string, string> = {
  IDLE: '#6b7280',
  PRECHARGE: '#eab308',
  READY: '#22c55e',
  RUNNING: '#06b6d4',
  BOOSTING: '#a855f7',
  BRAKING: '#f97316',
  STOPPED: '#ef4444',
}

function enrichData(history: SimData[]) {
  return history.map((d, i) => ({
    idx: i,
    V: parseFloat(d.voltage_v.toFixed(1)),
    v: parseFloat(d.velocity_kmh.toFixed(1)),
    a: parseFloat(d.acceleration_ms2.toFixed(2)),
    F: parseFloat((d.mass_kg * d.acceleration_ms2).toFixed(1)),
    I: parseFloat(d.current_a.toFixed(1)),
  }))
}

const CHARTS = [
  { key: 'V', label: 'Tensión',      unit: 'V',     color: '#eab308' },
  { key: 'v', label: 'Velocidad',    unit: 'km/h',  color: '#22c55e' },
  { key: 'a', label: 'Aceleración',  unit: 'm/s²',  color: '#60a5fa' },
  { key: 'F', label: 'Fuerza F=ma',  unit: 'N',     color: '#f97316' },
  { key: 'I', label: 'Intensidad',   unit: 'A',     color: '#ef4444' },
]

function MiniChart({ data, dataKey, color, label, unit }: {
  data: ReturnType<typeof enrichData>
  dataKey: string
  color: string
  label: string
  unit: string
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Header separado del área del chart */}
      <div className="flex items-center gap-2 px-1 mb-0.5 flex-none">
        <div className="w-3 h-0.5 rounded" style={{ background: color }} />
        <span className="text-xs font-medium text-gray-300">{label}</span>
        <span className="text-xs text-gray-500 ml-auto">{unit}</span>
      </div>
      {/* Área del chart sin texto encima */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 8, left: -8, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis dataKey="idx" hide />
            <YAxis
              tick={{ fontSize: 9, fill: '#6b7280' }}
              width={36}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#111827',
                border: `1px solid ${color}40`,
                borderRadius: 6,
                fontSize: 11,
                padding: '4px 8px',
              }}
              labelFormatter={() => ''}
              formatter={(val: number) => [`${val} ${unit}`, label]}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function TelemetryCharts({ history, stateHistory }: Props) {
  const enriched = enrichData(history)

  return (
    <div className="flex flex-col h-full gap-0.5">
      {CHARTS.map(c => (
        <MiniChart
          key={c.key}
          data={enriched}
          dataKey={c.key}
          color={c.color}
          label={c.label}
          unit={c.unit}
        />
      ))}

      {/* Cronograma de estados */}
      <div className="flex-none pt-1 border-t border-gray-800">
        <div className="text-xs text-gray-500 mb-1">Cronograma</div>
        <div className="flex gap-1 flex-wrap">
          {stateHistory.slice(-14).map((ev, i) => (
            <span
              key={i}
              className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{
                background: STATE_COLORS[ev.state] + '25',
                color: STATE_COLORS[ev.state],
                border: `1px solid ${STATE_COLORS[ev.state]}50`,
              }}
            >
              {ev.state}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
