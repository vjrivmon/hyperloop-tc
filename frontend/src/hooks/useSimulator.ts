import { useCallback, useEffect, useRef, useState } from 'react'
import { SimData, SimMessage, StateEvent } from '../types'

const WS_URL = 'ws://localhost:5001/backend/stream'
const HTTP_URL = 'http://localhost:8001'
const HISTORY_LIMIT = 40
const MSG_LIMIT = 50

let msgIdCounter = 0

export function useSimulator() {
  const [connected, setConnected] = useState(false)
  const [data, setData] = useState<SimData | null>(null)
  const [history, setHistory] = useState<SimData[]>([])
  const [messages, setMessages] = useState<SimMessage[]>([])
  const [stateHistory, setStateHistory] = useState<StateEvent[]>([])
  const [crashed, setCrashed] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastStateRef = useRef<string>('')

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }

    ws.onclose = () => {
      setConnected(false)
      reconnectTimer.current = setTimeout(connect, 2000)
    }

    ws.onerror = () => {
      ws.close()
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.topic === 'data') {
          const d = msg.payload as SimData
          setData(d)
          setHistory(prev => {
            const next = [...prev, d]
            return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next
          })
          // Track state changes
          if (d.state !== lastStateRef.current) {
            lastStateRef.current = d.state
            setStateHistory(prev => [...prev.slice(-99), { state: d.state, timestamp: d.timestamp }])
          }
        } else if (msg.topic === 'message') {
          const p = msg.payload
          const newMsg: SimMessage = {
            id: ++msgIdCounter,
            type: p.type,
            content: p.content,
            timestamp: new Date().toLocaleTimeString(),
          }
          setMessages(prev => {
            const next = [...prev, newMsg]
            return next.length > MSG_LIMIT ? next.slice(next.length - MSG_LIMIT) : next
          })
          if (p.type === 'critical') {
            setCrashed(true)
            setTimeout(() => setCrashed(false), 2500)
          }
        }
      } catch (_) { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [connect])

  const sendCommand = useCallback(async (command: string, payload?: { mass: number }) => {
    const body: Record<string, unknown> = { command }
    if (payload) body.payload = payload
    const res = await fetch(`${HTTP_URL}/api/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Command failed')
    }
  }, [])

  const calculate = useCallback(async (m: number, d: number) => {
    const res = await fetch(`${HTTP_URL}/api/calculate?m=${m}&d=${d}`)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Calculation failed')
    }
    return res.json() as Promise<{ braking_position_m: number }>
  }, [])

  return { connected, data, history, messages, stateHistory, crashed, sendCommand, calculate }
}
