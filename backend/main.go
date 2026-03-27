package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/rs/cors"
	"hyperloop-tc-backend/api"
	"hyperloop-tc-backend/simulator"
)

func main() {
	sim := simulator.NewSimState()
	hub := api.NewHub()

	// Arrancar loop de simulación a 4 Hz
	hub.StartLoop(sim)

	// --- Servidor WebSocket (puerto 5001) ---
	wsMux := http.NewServeMux()
	wsMux.HandleFunc("/backend/stream", hub.HandleWS)

	go func() {
		fmt.Println("WebSocket server listening on :5001")
		if err := http.ListenAndServe(":5001", wsMux); err != nil {
			log.Fatalf("WS server error: %v", err)
		}
	}()

	// --- Servidor HTTP (puerto 8001) ---
	handler := api.NewHTTPHandler(sim, hub)

	httpMux := http.NewServeMux()
	httpMux.HandleFunc("/api/command", handler.HandleCommand)
	httpMux.HandleFunc("/api/calculate", handler.HandleCalculate)

	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: false,
	})

	fmt.Println("HTTP server listening on :8001")
	if err := http.ListenAndServe(":8001", corsHandler.Handler(httpMux)); err != nil {
		log.Fatalf("HTTP server error: %v", err)
	}
}
