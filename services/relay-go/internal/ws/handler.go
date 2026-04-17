package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"github.com/YI1219/The-Damn-Life/services/relay-go/internal/hub"
	"github.com/YI1219/The-Damn-Life/services/relay-go/internal/role"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 512 * 1024
)

// Handler returns an http.Handler that upgrades to WebSocket and bridges session peers.
func Handler(h *hub.Hub, allowOrigin func(r *http.Request) bool) http.Handler {
	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 4096,
		CheckOrigin:     allowOrigin,
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		sessionID := strings.TrimSpace(q.Get("session"))
		if sessionID == "" {
			http.Error(w, "query session is required", http.StatusBadRequest)
			return
		}
		rn, key, err := role.ParseRef(q.Get("role"))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("ws upgrade: %v", err)
			return
		}
		conn.SetReadLimit(maxMessageSize)
		if err := conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
			_ = conn.Close()
			return
		}
		conn.SetPongHandler(func(string) error {
			return conn.SetReadDeadline(time.Now().Add(pongWait))
		})

		c := hub.NewClient(h, conn, sessionID, rn, key)
		h.Register(c)
		go writePump(c)
		readPump(c)
	})
}

func readPump(c *hub.Client) {
	defer func() {
		c.Hub().Unregister(c)
		c.ShutdownSend()
	}()
	for {
		_, message, err := c.Conn().ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("ws read error: %v", err)
			}
			return
		}
		if err := ValidateEnvelope(message); err != nil {
			reply, mErr := json.Marshal(hub.BadEnvelopeError(err))
			if mErr == nil {
				select {
				case c.Send() <- reply:
				default:
				}
			}
			continue
		}
		// MVP: acknowledge `session.join` so UIs can advance to "ready".
		// Relay remains payload-opaque; it only echoes workspaceId (if any) and assigns sessionId from query.
		var env MinimalEnvelope
		if uErr := json.Unmarshal(message, &env); uErr == nil && env.Type == "session.join" {
			if ack, aErr := SessionJoinedAck(message, c.SessionID()); aErr == nil {
				select {
				case c.Send() <- ack:
				default:
				}
			}
			// Also forward join to peer (useful for diagnostics), but ack is local-only.
		}
		c.Hub().Forward(c, message)
	}
}

func writePump(c *hub.Client) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = c.Conn().Close()
	}()
	for {
		select {
		case msg, ok := <-c.Outbound():
			if err := c.Conn().SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
				return
			}
			if !ok {
				_ = c.Conn().WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
				return
			}
			if err := c.Conn().WriteMessage(websocket.TextMessage, msg); err != nil {
				return
			}
		case <-ticker.C:
			if err := c.Conn().SetWriteDeadline(time.Now().Add(writeWait)); err != nil {
				return
			}
			if err := c.Conn().WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
