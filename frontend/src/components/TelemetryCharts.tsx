import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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

// Calcular F = m * a (Newton)
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

function MiniChart({ data, dataKey, color, unit, label }: {
  data: ReturnType<typeof enrichData>
  dataKey: string
  color: string
  unit: string
  label: string
}) {
  return (
    <div className="flex-1 min-h-0">
      <div className="text-xs text-gray-400 mb-0.5 ml-1">{label} <span className="text-gray-600">({unit})</span></div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 4, left: -10, bottom: 2 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="idx" hide />
          <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} width={38} />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #374151', fontSize: 11 }}
            labelFormatter={() => ''}
          />
          <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} strokeWidth={1.5} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TelemetryCharts({ history, stateHistory }: Props) {
  const enriched = enrichData(history)

  return (
    <div className="flex flex-col h-full gap-1">
      <MiniChart data={enriched} dataKey="V" color="#eab308" unit="V" label="Tensión" />
      <MiniChart data={enriched} dataKey="v" color="#22c55e" unit="km/h" label="Velocidad" />
      <MiniChart data={enriched} dataKey="a" color="#60a5fa" unit="m/s²" label="Aceleración" />
      <MiniChart data={enriched} dataKey="F" color="#f97316" unit="N" label="Fuerza (F=ma)" />
      <MiniChart data={enriched} dataKey="I" color="#ef4444" unit="A" label="Intensidad" />

      {/* Cronograma estados */}
      <div className="flex-none">
        <div className="text-xs text-gray-400 mb-1 ml-1">Cronograma de estados</div>
        <div className="flex gap-1 flex-wrap">
          {stateHistory.slice(-12).map((ev, i) => (
            <span
              key={i}
              className="text-xs px-1.5 py-0.5 rounded font-mono"
              style={{ background: STATE_COLORS[ev.state] + '30', color: STATE_COLORS[ev.state], border: `1px solid ${STATE_COLORS[ev.state]}50` }}
            >
              {ev.state}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
