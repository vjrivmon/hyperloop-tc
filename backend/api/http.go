package api

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"

	"hyperloop-tc-backend/simulator"
)

type HTTPHandler struct {
	sim *simulator.SimState
	hub *Hub
}

func NewHTTPHandler(sim *simulator.SimState, hub *Hub) *HTTPHandler {
	return &HTTPHandler{sim: sim, hub: hub}
}

func (h *HTTPHandler) HandleCommand(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req simulator.CommandRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	msgs, err := h.sim.HandleCommand(req)
	if err != nil {
		// Emitir error por WS también
		h.hub.Broadcast(simulator.WSMessage{
			Topic: "message",
			Payload: map[string]string{
				"type":    "error",
				"content": err.Error(),
			},
		})
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for _, m := range msgs {
		h.hub.Broadcast(m)
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

func (h *HTTPHandler) HandleCalculate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	mStr := r.URL.Query().Get("m")
	dStr := r.URL.Query().Get("d")

	if mStr == "" || dStr == "" {
		http.Error(w, "Missing parameters m and d", http.StatusBadRequest)
		return
	}

	m, err := strconv.ParseFloat(mStr, 64)
	if err != nil || m <= 0 {
		http.Error(w, "Invalid mass m", http.StatusBadRequest)
		return
	}

	d, err := strconv.ParseFloat(dStr, 64)
	if err != nil || d < 0 {
		http.Error(w, "Invalid distance d", http.StatusBadRequest)
		return
	}

	// v0 = 25 km/h en m/s
	v0 := 25.0 / 3.6
	dBrake := (v0 * v0 * m) / (2 * simulator.FBrake)
	sBrake := (simulator.TrackLength - d) - dBrake

	if sBrake < 0 {
		http.Error(w, fmt.Sprintf("Braking position would be negative (%.2f m). Reduce distance or mass.", sBrake), http.StatusBadRequest)
		return
	}

	sBrake = math.Round(sBrake*100) / 100

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]float64{"braking_position_m": sBrake})
}
