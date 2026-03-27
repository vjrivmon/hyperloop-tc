export type SimState =
  | 'IDLE'
  | 'PRECHARGE'
  | 'READY'
  | 'RUNNING'
  | 'BOOSTING'
  | 'BRAKING'
  | 'STOPPED'

export type MessageType = 'info' | 'success' | 'error' | 'critical'

export interface SimData {
  timestamp: string
  state: SimState
  position_m: number
  velocity_kmh: number
  acceleration_ms2: number
  mass_kg: number
  voltage_v: number
  current_a: number
}

export interface SimMessage {
  id: number
  type: MessageType
  content: string
  timestamp: string
}

export interface StateEvent {
  state: SimState
  timestamp: string
}
