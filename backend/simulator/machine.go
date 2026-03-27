package simulator

import "fmt"

type CommandRequest struct {
	Command string  `json:"command"`
	Payload *struct {
		Mass float64 `json:"mass"`
	} `json:"payload,omitempty"`
}

// HandleCommand procesa un comando y retorna mensajes WS o error
func (s *SimState) HandleCommand(req CommandRequest) ([]WSMessage, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	cmd := req.Command
	state := s.State

	// RESET siempre válido
	if cmd == "RESET" {
		s.resetLocked()
		return []WSMessage{msgInfo("System reset")}, nil
	}

	switch cmd {
	case "PRECHARGE":
		if state != StateIdle {
			return nil, fmt.Errorf("Command PRECHARGE not allowed in state %s", state)
		}
		s.State = StatePrecharge
		s.Voltage = 0
		return []WSMessage{msgInfo("Precharge started")}, nil

	case "START":
		if state != StateReady {
			return nil, fmt.Errorf("Command START not allowed in state %s", state)
		}
		if req.Payload == nil || req.Payload.Mass <= 0 {
			return nil, fmt.Errorf("START requires a valid mass")
		}
		s.Mass = req.Payload.Mass
		s.Velocity = VBase
		s.Acceleration = 0
		s.Position = 0
		s.PostBooster = false
		s.MechanicalStop = false
		s.State = StateRunning
		return []WSMessage{msgInfo(fmt.Sprintf("Booster test started. Mass: %.0f kg", s.Mass))}, nil

	case "BRAKE":
		if state != StateRunning && state != StateBoosting {
			return nil, fmt.Errorf("Command BRAKE not allowed in state %s", state)
		}
		s.State = StateBraking
		return []WSMessage{msgInfo("Braking initiated")}, nil

	default:
		return nil, fmt.Errorf("Unknown command: %s", cmd)
	}
}

func (s *SimState) resetLocked() {
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
