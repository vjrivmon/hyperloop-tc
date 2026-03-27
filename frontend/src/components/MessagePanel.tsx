import { useEffect, useRef } from 'react'
import { SimMessage } from '../types'
import { cn } from '../lib/utils'

interface Props {
  messages: SimMessage[]
}

const TYPE_STYLES = {
  info: 'text-blue-400 border-blue-900',
  success: 'text-green-400 border-green-900',
  error: 'text-red-400 border-red-900',
  critical: 'text-red-300 border-red-700 critical-pulse',
}

const TYPE_ICONS = {
  info: 'ℹ',
  success: '✓',
  error: '✗',
  critical: '⚠',
}

export function MessagePanel({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 border-b border-gray-800">
        Mensajes del simulador
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-gray-600 text-center mt-4">Sin mensajes</p>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={cn(
              'flex items-start gap-1.5 text-xs px-2 py-1 rounded border-l-2',
              TYPE_STYLES[msg.type]
            )}
          >
            <span className="font-bold flex-none">{TYPE_ICONS[msg.type]}</span>
            <span className="flex-1 break-words">{msg.content}</span>
            <span className="text-gray-600 flex-none text-[10px]">{msg.timestamp}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
