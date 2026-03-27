import { useSimulator } from './hooks/useSimulator'
import { TelemetryCharts } from './components/TelemetryCharts'
import { BoosterScene } from './components/BoosterScene'
import { ControlPanel } from './components/ControlPanel'
import { MessagePanel } from './components/MessagePanel'
import { cn } from './lib/utils'

const STATE_COLORS: Record<string, string> = {
  IDLE: 'text-gray-400 bg-gray-800',
  PRECHARGE: 'text-yellow-300 bg-yellow-900/40',
  READY: 'text-green-300 bg-green-900/40',
  RUNNING: 'text-cyan-300 bg-cyan-900/40',
  BOOSTING: 'text-purple-300 bg-purple-900/40',
  BRAKING: 'text-orange-300 bg-orange-900/40',
  STOPPED: 'text-red-300 bg-red-900/40',
}

export default function App() {
  const { connected, data, history, messages, stateHistory, crashed, sendCommand, calculate } = useSimulator()

  const state = data?.state ?? null
  const stateStr = state ?? 'IDLE'

  return (
    <div
      className={cn(
        'h-screen flex flex-col bg-gray-950 text-white overflow-hidden transition-colors duration-300',
        crashed && 'flash-red'
      )}
    >
      {/* HEADER */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900 flex-none">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight">⚡ Hyperloop UPV</span>
          <span className="text-gray-600 text-sm">Booster Test Bench</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Datos en tiempo real en el header */}
          {data && (
            <div className="hidden md:flex items-center gap-4 text-xs text-gray-400">
              <span>s: <span className="text-white font-mono">{data.position_m.toFixed(1)}m</span></span>
              <span>v: <span className="text-cyan-300 font-mono">{data.velocity_kmh.toFixed(1)}km/h</span></span>
              <span>V: <span className="text-yellow-300 font-mono">{data.voltage_v.toFixed(0)}V</span></span>
              <span>m: <span className="text-white font-mono">{data.mass_kg.toFixed(0)}kg</span></span>
            </div>
          )}
          {/* Estado actual */}
          <span className={cn('px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider', STATE_COLORS[stateStr])}>
            {stateStr}
          </span>
          {/* Conexión */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className={cn('w-2 h-2 rounded-full', connected ? 'bg-green-500' : 'bg-red-500')} />
            <span className="text-gray-500">{connected ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>
      </header>

      {/* LAYOUT PRINCIPAL */}
      <div className="flex flex-1 overflow-hidden gap-2 p-2 min-h-0">

        {/* COLUMNA IZQUIERDA: Controles + Mensajes */}
        <div className="flex flex-col gap-2 w-64 flex-none min-h-0">
          <div className="flex-none">
            <ControlPanel state={state} sendCommand={sendCommand} calculate={calculate} />
          </div>
          <div className="flex-1 min-h-0">
            <MessagePanel messages={messages} />
          </div>
        </div>

        {/* COLUMNA CENTRAL: Gráficas */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-3 flex flex-col h-full min-h-0">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex-none">Telemetría</h2>
            <div className="flex-1 min-h-0">
              <TelemetryCharts history={history} stateHistory={stateHistory} />
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Modelo 3D */}
        <div className="w-80 flex-none flex flex-col min-h-0">
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden flex flex-col h-full">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 border-b border-gray-800 flex-none">
              Modelo 3D — Carro Booster
            </h2>
            <div className="flex-1 min-h-0">
              <BoosterScene positionM={data?.position_m ?? 0} state={stateStr} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
