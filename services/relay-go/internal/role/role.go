package role

import (
	"fmt"
	"strings"
)

// Role identifies which side of a bridged session a client occupies.
type Role string

const (
	Remote Role = "remote"
	Host   Role = "host"
)

// ParseRef normalizes and validates a role query parameter.
// Supported forms:
// - "remote" / "host"
// - "remote:<key>" / "host:<key>" (enables multiple independent pairs within one session)
func ParseRef(s string) (Role, string, error) {
	raw := strings.ToLower(strings.TrimSpace(s))
	if raw == "" {
		return "", "", fmt.Errorf("role must be %q or %q", Remote, Host)
	}
	parts := strings.SplitN(raw, ":", 2)
	base := parts[0]
	key := ""
	if len(parts) == 2 {
		key = strings.TrimSpace(parts[1])
	}
	switch base {
	case string(Remote):
		return Remote, key, nil
	case string(Host):
		return Host, key, nil
	default:
		return "", "", fmt.Errorf("role must be %q or %q", Remote, Host)
	}
}
