package simulator

import (
	"fmt"
	"math"
	"sync"
	"time"
)

type State string

const (
	StateIdle      State = "IDLE"
	StatePrecharge State = "PRECHARGE"
	StateReady     State = "READY"
	StateRunning   State = "RUNNING"
	StateBoosting  State = "BOOSTING"
	StateBraking   State = "BRAKING"
	StateStopped   State = "STOPPED"
)

const (
	SimSpeed   = 0.2
	TickHz     = 4.0
	TickReal   = 1.0 / TickHz              // 0.25s real
	DtPhysical = TickReal * SimSpeed       // 0.05s física
	VBase      = 4.0                       // km/h pre-booster
	VMax       = 25.0                      // km/h post-booster
	VoltMax    = 400.0
	VoltStep   = 25.0                      // V por tick en PRECHARGE
	BoosterStart = 2.0                     // m
	BoosterEnd   = 4.0                     // m
	TrackLength  = 50.0                    // m
	FBrake       = 196.0                   // N
	IMax         = 200.0                   // A
	MuBraking    = 0.5
	G            = 9.81
)

type SimState struct {
	mu sync.RWMutex

	State          State
	Position       float64 // m
	Velocity       float64 // km/h (almacenado en km/h, física en m/s)
	Acceleration   float64 // m/s²
	Mass           float64 // kg
	Voltage        float64 // V
	Current        float64 // A
	PostBooster    bool
	MechanicalStop bool
}

type WSMessage struct {
	Topic   string      `json:"topic"`
	Payload interface{} `json:"payload"`
}

type DataPayload struct {
	Timestamp       string  `json:"timestamp"`
	State           string  `json:"state"`
	PositionM       float64 `json:"position_m"`
	VelocityKmh     float64 `json:"velocity_kmh"`
	AccelerationMs2 float64 `json:"acceleration_ms2"`
	MassKg          float64 `json:"mass_kg"`
	VoltageV        float64 `json:"voltage_v"`
	CurrentA        float64 `json:"current_a"`
}

type MessagePayload struct {
	Type    string `json:"type"`
	Content string `json:"content"`
}

func NewSimState() *SimState {
	return &SimState{State: StateIdle}
}

func (s *SimState) Snapshot() DataPayload {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return DataPayload{
		Timestamp:       time.Now().UTC().Format(time.RFC3339Nano),
		State:           string(s.State),
		PositionM:       round2(s.Position),
		VelocityKmh:     round2(s.Velocity),
		AccelerationMs2: round2(s.Acceleration),
		MassKg:          round2(s.Mass),
		VoltageV:        round2(s.Voltage),
		CurrentA:        round2(s.Current),
	}
}

func (s *SimState) Tick() ([]WSMessage, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	var msgs []WSMessage

	switch s.State {
	case StatePrecharge:
		s.Voltage += VoltStep
		if s.Voltage >= VoltMax {
			s.Voltage = VoltMax
			s.State = StateReady
			msgs = append(msgs, msgSuccess("V = 400V precharge completed successfully"))
		}

	case StateRunning:
		if !s.PostBooster {
			// Pre-booster: velocidad base
			s.Velocity = VBase
			s.Acceleration = 0
			s.Current = 0
			// ¿Entramos en sección booster?
			vMs := kmhToMs(s.Velocity)
			s.Position += vMs * DtPhysical
			if s.Position >= BoosterStart && s.Position < BoosterEnd {
				s.State = StateBoosting
				msgs = append(msgs, msgInfo("Booster section entered"))
			}
		} else {
			// Post-booster: velocidad constante 25 km/h
			s.Velocity = VMax
			s.Acceleration = 0
			s.Current = 0
			vMs := kmhToMs(s.Velocity)
			s.Position += vMs * DtPhysical
			if s.Position >= TrackLength {
				s.Position = TrackLength
				s.MechanicalStop = true
				s.State = StateStopped
				s.Velocity = 0
				s.Acceleration = 0
				s.Current = 0
				msgs = append(msgs, msgCritical("Cart reached mechanical stopper at s = 50 m"))
			}
		}

	case StateBoosting:
		// Calcular aceleración para llegar a vf=25 km/h en s=4
		remaining := BoosterEnd - s.Position
		if remaining < 0.001 {
			// Salida del booster
			s.Velocity = VMax
			s.Acceleration = 0
			s.Current = 0
			s.State = StateRunning
			s.PostBooster = true
			msgs = append(msgs, msgSuccess("Boost completed. Velocity: 25 km/h"))
		} else {
			vMs := kmhToMs(s.Velocity)
			vfMs := kmhToMs(VMax)
			s.Acceleration = (vfMs*vfMs - vMs*vMs) / (2 * remaining)
			// Actualizar velocidad y posición
			vMs += s.Acceleration * DtPhysical
			s.Velocity = msToKmh(vMs)
			s.Position += vMs * DtPhysical
			// Intensidad
			relPos := s.Position - BoosterStart
			s.Current = IMax * math.Sin(math.Pi*relPos/2)
			if s.Current < 0 {
				s.Current = 0
			}
			if s.Position >= BoosterEnd {
				s.Position = BoosterEnd
				s.Velocity = VMax
				s.Acceleration = 0
				s.Current = 0
				s.State = StateRunning
				s.PostBooster = true
				msgs = append(msgs, msgSuccess("Boost completed. Velocity: 25 km/h"))
			}
		}

	case StateBraking:
		a := -FBrake / s.Mass
		s.Acceleration = a
		vMs := kmhToMs(s.Velocity)
		vMs += a * DtPhysical
		s.Position += vMs * DtPhysical

		if vMs <= 0 || s.Position >= TrackLength {
			if s.Position >= TrackLength {
				s.Position = TrackLength
				s.MechanicalStop = true
				msgs = append(msgs, msgCritical("Cart reached mechanical stopper at s = 50 m"))
			} else {
				msgs = append(msgs, msgSuccess("Cart stopped at s = "+fmtF(s.Position)+" m"))
			}
			s.Velocity = 0
			s.Acceleration = 0
			s.Current = 0
			s.State = StateStopped
		} else {
			s.Velocity = msToKmh(vMs)
		}
	}

	return msgs, true
}

func (s *SimState) Reset() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.State = StateIdle
	s.Position = 0
	s.Velocity = 0
	s.Acceleration = 0
	s.Mass = 0
	s.Voltage = 0
	s.Current = 0
	s.PostBooster = false
	s.MechanicalStop = false
}

// Helpers
func kmhToMs(v float64) float64 { return v / 3.6 }
func msToKmh(v float64) float64 { return v * 3.6 }
func round2(v float64) float64  { return math.Round(v*100) / 100 }

func fmtF(v float64) string {
	return fmt.Sprintf("%.1f", v)
}

func msgInfo(content string) WSMessage {
	return WSMessage{Topic: "message", Payload: MessagePayload{Type: "info", Content: content}}
}
func msgSuccess(content string) WSMessage {
	return WSMessage{Topic: "message", Payload: MessagePayload{Type: "success", Content: content}}
}
func msgCritical(content string) WSMessage {
	return WSMessage{Topic: "message", Payload: MessagePayload{Type: "critical", Content: content}}
}
func msgError(content string) WSMessage {
	return WSMessage{Topic: "message", Payload: MessagePayload{Type: "error", Content: content}}
}
