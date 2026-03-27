# 🚄 Training Center SW — Hyperloop UPV

Emulador de bancada de pruebas para el **booster** del sistema Hyperloop UPV.  
Proyecto final del Training Center de Software 2026.

---

## ¿Qué es esto?

Una aplicación web que simula el comportamiento completo de la bancada booster: un carro sobre un raíl de 50 m que es impulsado por el booster entre los metros 2 y 4, pasando de 4 km/h a 25 km/h. El panel de control muestra telemetría en tiempo real, permite enviar órdenes al simulador y calcula la posición óptima de frenado.

## Estructura del proyecto

```
hyperloop-tc/
├── backend/          # Simulador en Go (WebSocket + HTTP)
└── frontend/         # Panel de control en React + TypeScript
```

---

## Requisitos

| Herramienta | Versión mínima |
|-------------|----------------|
| Go          | 1.22+          |
| Node.js     | 18+            |

---

## Instalación y arranque

### 1. Backend

```bash
cd backend
go mod download
go run -buildvcs=false .
```

El backend expone dos servicios:

| Servicio   | URL                                    |
|------------|----------------------------------------|
| WebSocket  | `ws://localhost:5001/backend/stream`   |
| HTTP API   | `http://localhost:8001`                |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre el navegador en **http://localhost:5173**

> ⚠️ Arranca el backend **antes** que el frontend. Asegúrate de que los puertos 5001 y 8001 están libres.

---

## Uso

| Botón        | Estado requerido       | Descripción                                      |
|--------------|------------------------|--------------------------------------------------|
| `PRECHARGE`  | IDLE                   | Inicia la precarga de supercondensadores (0→400V)|
| `START`      | READY                  | Lanza la prueba. Requiere introducir la masa (kg)|
| `BRAKE`      | RUNNING / BOOSTING     | Frena el carro                                   |
| `RESET`      | Cualquiera             | Reinicia el simulador al estado inicial          |

**Calculadora de freno:** introduce la masa del carro y la distancia deseada al final del raíl para obtener la posición óptima en la que pulsar el freno.

---

## Estados del simulador

```
IDLE → PRECHARGE → READY → RUNNING ⇄ BOOSTING → BRAKING → STOPPED
                                  ↖_________________________________↗ (RESET)
```

| Estado       | Descripción                                        |
|--------------|----------------------------------------------------|
| `IDLE`       | Reposo. Todas las variables a 0                    |
| `PRECHARGE`  | Cargando supercondensadores. V sube 25V/tick       |
| `READY`      | V = 400V. Listo para iniciar                       |
| `RUNNING`    | Carro en movimiento (pre o post booster)           |
| `BOOSTING`   | Carro en sección booster (s: 2→4 m). Acelera      |
| `BRAKING`    | Frenando. F_brake = 196 N                          |
| `STOPPED`    | Detenido                                           |

---

## Arquitectura técnica

### Backend (Go)

- **Máquina de estados** con transiciones controladas por comandos HTTP
- **Física simplificada:** F = m·a, μ = 0.5 al frenar, SIM_SPEED = 0.2×
- **WebSocket** emite telemetría a 4 Hz con formato JSON estandarizado
- **HTTP API** recibe comandos y calcula posición de frenado

```
backend/
├── main.go              # Entry point
├── simulator/
│   ├── state.go         # Variables, física, Tick()
│   └── machine.go       # FSM y HandleCommand()
└── api/
    ├── websocket.go     # Hub WS y loop de emisión
    └── http.go          # Handlers /api/command y /api/calculate
```

### Frontend (React + TypeScript)

- **Gráficas en tiempo real** (Recharts): V, v, a, F=ma, I con historial de 10 s
- **Modelo 3D interactivo** (Three.js): cámara que sigue al carro con interpolación suave
- **Panel de control** con botones habilitados/deshabilitados según el estado actual
- **Log de mensajes** con tipos info / success / error / critical

```
frontend/src/
├── App.tsx                      # Layout principal (una sola vista, sin scroll)
├── types.ts                     # Tipos TypeScript compartidos
├── hooks/useSimulator.ts        # WebSocket + HTTP + estado global
└── components/
    ├── TelemetryCharts.tsx      # Gráficas de telemetría
    ├── BoosterScene.tsx         # Modelo 3D
    ├── ControlPanel.tsx         # Botones + calculadora
    └── MessagePanel.tsx         # Log de mensajes
```

### API Reference

**POST** `/api/command`
```json
{ "command": "START", "payload": { "mass": 40 } }
```

**GET** `/api/calculate?m=40&d=5`
```json
{ "braking_position_m": 37.5 }
```

**WebSocket** — datos (4 Hz):
```json
{
  "topic": "data",
  "payload": {
    "timestamp": "2026-03-27T17:00:00Z",
    "state": "RUNNING",
    "position_m": 10.5,
    "velocity_kmh": 25.0,
    "acceleration_ms2": 0.0,
    "mass_kg": 40.0,
    "voltage_v": 400.0,
    "current_a": 0.0
  }
}
```

**WebSocket** — mensajes:
```json
{ "topic": "message", "payload": { "type": "success", "content": "Boost completed. Velocity: 25 km/h" } }
```

---

## Stack

| Capa      | Tecnología                                      |
|-----------|-------------------------------------------------|
| Backend   | Go 1.22, gorilla/websocket, rs/cors             |
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS        |
| Gráficas  | Recharts                                        |
| 3D        | Three.js, @react-three/fiber, @react-three/drei |

---

## Autor

**Javier Ribal del Río** — Hyperloop UPV · Training Center Software 2026
