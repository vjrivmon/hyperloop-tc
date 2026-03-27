# Training Center SW — Hyperloop UPV

Emulador de bancada booster con frontend React y backend Go.

## Requisitos

- Go 1.22+
- Node.js 18+

## Backend (Go)

```bash
cd backend
go mod download
go run -buildvcs=false .
```

Expone:
- WebSocket: `ws://localhost:5001/backend/stream`
- HTTP: `http://localhost:8001`

## Frontend (React + TypeScript + Vite)

```bash
cd frontend
npm install
npm run dev
```

Abre: http://localhost:5173

## Funcionamiento

1. Arranca el backend primero
2. Arranca el frontend
3. En la UI:
   - **PRECHARGE** → inicia la precarga (V sube de 0 a 400V)
   - **START** → introduce la masa (10-200 kg) y lanza la prueba
   - **BRAKE** → frena el carro cuando quieras
   - **RESET** → reinicia el simulador
   - **Calculadora** → introduce masa y distancia deseada al final para saber dónde frenar

## Arquitectura

```
hyperloop-tc/
├── backend/
│   ├── main.go                 # Entry point: WS:5001 + HTTP:8001
│   ├── go.mod
│   ├── simulator/
│   │   ├── state.go            # Variables, física, Tick()
│   │   └── machine.go          # FSM, HandleCommand()
│   └── api/
│       ├── websocket.go        # Hub WS, loop 4Hz
│       └── http.go             # /api/command + /api/calculate
└── frontend/
    ├── src/
    │   ├── App.tsx             # Layout principal (una sola vista)
    │   ├── types.ts            # Tipos TypeScript
    │   ├── hooks/
    │   │   └── useSimulator.ts # WebSocket + HTTP + estado global
    │   └── components/
    │       ├── TelemetryCharts.tsx  # Gráficas V,v,a,F,I + cronograma
    │       ├── BoosterScene.tsx     # Modelo 3D Three.js
    │       ├── ControlPanel.tsx     # Botones + calculadora freno
    │       └── MessagePanel.tsx     # Log de mensajes
    └── vite.config.ts
```

## Estados del simulador

| Estado     | Descripción                              |
|------------|------------------------------------------|
| IDLE       | Reposo inicial                           |
| PRECHARGE  | Cargando supercondensadores (V: 0→400V)  |
| READY      | Listo para iniciar prueba                |
| RUNNING    | Carro en movimiento (pre/post booster)   |
| BOOSTING   | Carro en sección booster (s: 2→4 m)     |
| BRAKING    | Frenando                                 |
| STOPPED    | Detenido                                 |

## Nota sobre velocidad de simulación

El backend corre a 5× más lento que tiempo real (`SIM_SPEED=0.2`). Esto da ~33 segundos de margen en el tramo post-booster para enviar la orden de freno.

## Autor

Javier Ribal del Río — Hyperloop UPV Training Center 2026
