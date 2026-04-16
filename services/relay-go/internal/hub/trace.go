package hub

import (
	"crypto/rand"
	"encoding/hex"
)

func newTraceID() string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "relay-trace-unavailable"
	}
	return hex.EncodeToString(b[:])
}
