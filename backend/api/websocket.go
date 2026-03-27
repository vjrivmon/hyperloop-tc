package api

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"hyperloop-tc-backend/simulator"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Hub struct {
	mu      sync.RWMutex
	clients map[*websocket.Conn]bool
}

func NewHub() *Hub {
	return &Hub{clients: make(map[*websocket.Conn]bool)}
}

func (h *Hub) Register(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[conn] = true
}

func (h *Hub) Unregister(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, conn)
	conn.Close()
}

func (h *Hub) Broadcast(msg interface{}) {
	data, err := json.Marshal(msg)
	if err != nil {
		return
	}
	h.mu.RLock()
	defer h.mu.RUnlock()
	for conn := range h.clients {
		if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
			log.Printf("ws write error: %v", err)
		}
	}
}

func (h *Hub) HandleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade error: %v", err)
		return
	}
	h.Register(conn)
	defer h.Unregister(conn)

	// Mantener conexión abierta
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

// StartLoop arranca el loop de 4 Hz que emite datos y hace tick del simulador
func (h *Hub) StartLoop(sim *simulator.SimState) {
	ticker := time.NewTicker(time.Duration(simulator.TickReal * float64(time.Second)))
	go func() {
		for range ticker.C {
			msgs, _ := sim.Tick()
			// Emitir datos
			snap := sim.Snapshot()
			h.Broadcast(simulator.WSMessage{Topic: "data", Payload: snap})
			// Emitir mensajes de transición
			for _, m := range msgs {
				h.Broadcast(m)
			}
		}
	}()
}
