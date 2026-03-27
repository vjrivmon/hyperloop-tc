import { useState } from 'react'
import { SimState } from '../types'
import { cn } from '../lib/utils'

interface Props {
  state: SimState | null
  sendCommand: (cmd: string, payload?: { mass: number }) => Promise<void>
  calculate: (m: number, d: number) => Promise<{ braking_position_m: number }>
}

export function ControlPanel({ state, sendCommand, calculate }: Props) {
  const [mass, setMass] = useState('')
  const [massError, setMassError] = useState('')
  const [calcMass, setCalcMass] = useState('')
  const [calcDist, setCalcDist] = useState('')
  const [calcResult, setCalcResult] = useState<number | null>(null)
  const [calcError, setCalcError] = useState('')
  const [cmdError, setCmdError] = useState('')

  const canPrecharge = state === 'IDLE'
  const canStart = state === 'READY'
  const canBrake = state === 'RUNNING' || state === 'BOOSTING'
  const canReset = state !== null

  async function handleCommand(cmd: string) {
    setCmdError('')
    try {
      if (cmd === 'START') {
        const m = parseFloat(mass)
        if (isNaN(m) || m < 10 || m > 200) {
          setMassError('Masa debe ser entre 10 y 200 kg')
          return
        }
        setMassError('')
        await sendCommand('START', { mass: m })
      } else {
        await sendCommand(cmd)
      }
    } catch (e: unknown) {
      setCmdError(e instanceof Error ? e.message : 'Error desconocido')
    }
  }

  async function handleCalculate() {
    setCalcError('')
    setCalcResult(null)
    const m = parseFloat(calcMass)
    const d = parseFloat(calcDist)
    if (isNaN(m) || m <= 0) { setCalcError('Masa inválida'); return }
    if (isNaN(d) || d < 0 || d > 50) { setCalcError('Distancia inválida (0-50 m)'); return }
    try {
      const res = await calculate(m, d)
      setCalcResult(res.braking_position_m)
    } catch (e: unknown) {
      setCalcError(e instanceof Error ? e.message : 'Error de cálculo')
    }
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Botones de control */}
      <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Comandos</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleCommand('PRECHARGE')}
            disabled={!canPrecharge}
            className={cn(
              'px-3 py-2 rounded text-sm font-semibold transition-all',
              canPrecharge
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            )}
          >
            PRECHARGE
          </button>
          <button
            onClick={() => handleCommand('BRAKE')}
            disabled={!canBrake}
            className={cn(
              'px-3 py-2 rounded text-sm font-semibold transition-all',
              canBrake
                ? 'bg-orange-600 hover:bg-orange-500 text-white cursor-pointer'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            )}
          >
            BRAKE
          </button>
          <button
            onClick={() => handleCommand('RESET')}
            disabled={!canReset}
            className={cn(
              'px-3 py-2 rounded text-sm font-semibold transition-all col-span-2',
              canReset
                ? 'bg-gray-700 hover:bg-gray-600 text-white cursor-pointer'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            )}
          >
            RESET
          </button>
        </div>

        {/* START con input masa */}
        <div className="mt-2 flex flex-col gap-1">
          <div className="flex gap-2">
            <input
              type="number"
              value={mass}
              onChange={e => { setMass(e.target.value); setMassError('') }}
              placeholder="Masa (kg)"
              min={10}
              max={200}
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
            <button
              onClick={() => handleCommand('START')}
              disabled={!canStart}
              className={cn(
                'px-4 py-1.5 rounded text-sm font-semibold transition-all',
                canStart
                  ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              )}
            >
              START
            </button>
          </div>
          {massError && <p className="text-xs text-red-400">{massError}</p>}
          {cmdError && <p className="text-xs text-red-400">{cmdError}</p>}
        </div>
      </div>

      {/* Calculadora de freno */}
      <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Calculadora de freno</h3>
        <div className="flex flex-col gap-1.5">
          <input
            type="number"
            value={calcMass}
            onChange={e => setCalcMass(e.target.value)}
            placeholder="Masa del carro (kg)"
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <input
            type="number"
            value={calcDist}
            onChange={e => setCalcDist(e.target.value)}
            placeholder="Distancia al final (m)"
            min={0}
            max={50}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleCalculate}
            className="bg-purple-700 hover:bg-purple-600 text-white rounded py-1.5 text-sm font-semibold transition-all"
          >
            Calcular posición
          </button>
          {calcResult !== null && (
            <div className="bg-gray-800 rounded p-2 text-center">
              <span className="text-xs text-gray-400">Frenar en</span>
              <div className="text-lg font-bold text-purple-400">s = {calcResult} m</div>
            </div>
          )}
          {calcError && <p className="text-xs text-red-400">{calcError}</p>}
        </div>
      </div>
    </div>
  )
}
