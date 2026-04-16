package ws

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

// ValidateEnvelope checks JSON and a non-empty type field per docs/protocols/websocket-events.md.
func ValidateEnvelope(msg []byte) error {
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(msg, &raw); err != nil {
		return err
	}
	t, ok := raw["type"]
	if !ok {
		return errors.New("missing type")
	}
	var typeStr string
	if err := json.Unmarshal(t, &typeStr); err != nil {
		return fmt.Errorf("type: %w", err)
	}
	if typeStr == "" {
		return errors.New("empty type")
	}
	return nil
}

// MinimalEnvelope mirrors the cross-language wire shape; relay should remain payload-opaque.
// We only parse fields needed for `session.join` acknowledgement.
type MinimalEnvelope struct {
	ContractVersion string          `json:"contractVersion"`
	Timestamp       string          `json:"timestamp"`
	TraceID         string          `json:"traceId"`
	SessionID       string          `json:"sessionId,omitempty"`
	WorkspaceID     string          `json:"workspaceId,omitempty"`
	Type            string          `json:"type"`
	Payload         json.RawMessage `json:"payload"`
}

type sessionJoinPayload struct {
	WorkspaceID string `json:"workspaceId,omitempty"`
}

func newTraceID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "relay-trace-unavailable"
	}
	return hex.EncodeToString(b[:])
}

// SessionJoinedAck returns a contract-shaped `session.joined` envelope for the given session.
// It uses the incoming traceId when present to preserve causal linking.
func SessionJoinedAck(inbound []byte, sessionID string) ([]byte, error) {
	var env MinimalEnvelope
	if err := json.Unmarshal(inbound, &env); err != nil {
		return nil, err
	}
	trace := env.TraceID
	if trace == "" {
		trace = newTraceID()
	}
	cv := env.ContractVersion
	if cv == "" {
		cv = "0.1.0"
	}

	var join sessionJoinPayload
	_ = json.Unmarshal(env.Payload, &join)

	out := MinimalEnvelope{
		ContractVersion: cv,
		Timestamp:       time.Now().UTC().Format(time.RFC3339Nano),
		TraceID:         trace,
		SessionID:       sessionID,
		Type:            "session.joined",
		Payload:         []byte(`{}`),
	}
	if join.WorkspaceID != "" {
		out.Payload, _ = json.Marshal(map[string]any{"workspaceId": join.WorkspaceID})
	}
	return json.Marshal(out)
}
