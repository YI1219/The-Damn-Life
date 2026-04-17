package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/YI1219/The-Damn-Life/services/relay-go/internal/hub"
	"github.com/YI1219/The-Damn-Life/services/relay-go/internal/ws"
)

func main() {
	addr := os.Getenv("RELAY_ADDR")
	if addr == "" {
		addr = ":8765"
	}

	h := hub.New()
	allow := parseAllowedOrigins(os.Getenv("RELAY_ALLOWED_ORIGINS"))

	mux := http.NewServeMux()
	mux.HandleFunc("/health", health)
	mux.Handle("/ws", ws.Handler(h, allow))

	log.Printf("relay-go listening on %s (ws /ws?session=...&role=remote|host)", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

func health(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(`{"status":"ok"}`))
}

func parseAllowedOrigins(raw string) func(*http.Request) bool {
	raw = strings.TrimSpace(raw)
	if raw == "" || raw == "*" {
		return func(r *http.Request) bool { return true }
	}
	allowed := make(map[string]struct{})
	for _, p := range strings.Split(raw, ",") {
		o := strings.TrimSpace(p)
		if o != "" {
			allowed[o] = struct{}{}
		}
	}
	return func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		if origin == "" {
			return true
		}
		_, ok := allowed[origin]
		return ok
	}
}
