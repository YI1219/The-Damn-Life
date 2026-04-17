package hub

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/YI1219/The-Damn-Life/services/relay-go/internal/role"
)

// Hub maps session IDs to paired clients and forwards opaque JSON envelopes.
type Hub struct {
	mu       sync.RWMutex
	sessions map[string]*Session
}

// New creates an empty Hub.
func New() *Hub {
	return &Hub{sessions: make(map[string]*Session)}
}

// Register attaches a client to its session. An existing client for the same role is replaced.
func (h *Hub) Register(c *Client) {
	var old *Client
	h.mu.Lock()
	sess, ok := h.sessions[c.sessionID]
	if !ok {
		sess = &Session{}
		h.sessions[c.sessionID] = sess
	}
	old = sess.setClient(c)
	h.mu.Unlock()

	if old != nil {
		old.ShutdownSend()
	}
	debugf("register session=%q role=%s key=%q replaced_same_role=%t", c.sessionID, c.role, c.RoleKey(), old != nil)
}

// Unregister removes a client if it still owns its slot.
func (h *Hub) Unregister(c *Client) {
	h.mu.RLock()
	sess, ok := h.sessions[c.sessionID]
	h.mu.RUnlock()
	if !ok {
		debugf("unregister session=%q role=%s key=%q (unknown session)", c.sessionID, c.role, c.RoleKey())
		return
	}
	sess.removeIfMatch(c)
	if !sess.empty() {
		debugf("unregister session=%q role=%s key=%q (peer still connected)", c.sessionID, c.role, c.RoleKey())
		return
	}
	h.mu.Lock()
	defer h.mu.Unlock()
	cur, still := h.sessions[c.sessionID]
	if !still || cur != sess || !sess.empty() {
		debugf("unregister session=%q role=%s key=%q (skip map delete: race or repopulated)", c.sessionID, c.role, c.RoleKey())
		return
	}
	delete(h.sessions, c.sessionID)
	debugf("unregister session=%q role=%s key=%q (session key removed from hub)", c.sessionID, c.role, c.RoleKey())
}

// Forward delivers a message to the peer in the same session.
func (h *Hub) Forward(sender *Client, msg []byte) {
	h.mu.RLock()
	sess, ok := h.sessions[sender.sessionID]
	h.mu.RUnlock()
	if !ok {
		debugf("forward drop session=%q from=%s key=%q bytes=%d reason=no_session", sender.sessionID, sender.role, sender.RoleKey(), len(msg))
		return
	}
	peer := sess.peer(sender)
	if peer == nil {
		debugf("forward session=%q from=%s key=%q bytes=%d peer=offline (system.error to sender)", sender.sessionID, sender.role, sender.RoleKey(), len(msg))
		env := errorEnvelope("peer_offline", "no paired connection for this session yet", sender.roleRef())
		b, err := json.Marshal(env)
		if err != nil {
			return
		}
		select {
		case sender.send <- b:
		default:
		}
		return
	}
	select {
	case peer.send <- msg:
		debugf("forward ok session=%q from=%s key=%q bytes=%d", sender.sessionID, sender.role, sender.RoleKey(), len(msg))
	default:
		debugf("forward session=%q from=%s key=%q bytes=%d peer=slow_buffer (system.error to sender)", sender.sessionID, sender.role, sender.RoleKey(), len(msg))
		env := errorEnvelope("peer_slow", "peer write buffer full", sender.roleRef())
		b, err := json.Marshal(env)
		if err != nil {
			return
		}
		select {
		case sender.send <- b:
		default:
		}
	}
}

// Envelope matches docs/protocols/websocket-events.md (minimal fields).
type Envelope struct {
	Type      string          `json:"type"`
	Payload   json.RawMessage `json:"payload"`
	Timestamp string          `json:"timestamp"`
	TraceID   string          `json:"traceId"`
}

func errorEnvelope(code, detail string, from role.Role) Envelope {
	payload, _ := json.Marshal(map[string]any{
		"code":   code,
		"detail": detail,
		"from":   string(from),
	})
	return Envelope{
		Type:      "system.error",
		Payload:   payload,
		Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
		TraceID:   newTraceID(),
	}
}

// BadEnvelopeError builds system.error for malformed inbound JSON.
func BadEnvelopeError(err error) Envelope {
	payload, _ := json.Marshal(map[string]any{
		"code":   "invalid_envelope",
		"detail": fmt.Sprintf("%v", err),
	})
	return Envelope{
		Type:      "system.error",
		Payload:   payload,
		Timestamp: time.Now().UTC().Format(time.RFC3339Nano),
		TraceID:   newTraceID(),
	}
}
