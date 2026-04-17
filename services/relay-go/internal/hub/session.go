package hub

import (
	"sync"

	"github.com/YI1219/The-Damn-Life/services/relay-go/internal/role"
)

// Session holds one or more independent remote+host pairs for a logical session.
type Session struct {
	mu      sync.Mutex
	buckets map[string]*sessionBucket
}

type sessionBucket struct {
	remote *Client
	host   *Client
}

func (s *Session) bucket(key string) *sessionBucket {
	if s.buckets == nil {
		s.buckets = make(map[string]*sessionBucket)
	}
	b, ok := s.buckets[key]
	if !ok {
		b = &sessionBucket{}
		s.buckets[key] = b
	}
	return b
}

func (s *Session) setClient(c *Client) (replaced *Client) {
	s.mu.Lock()
	defer s.mu.Unlock()
	b := s.bucket(c.RoleKey())
	switch c.role {
	case role.Remote:
		replaced = b.remote
		b.remote = c
	case role.Host:
		replaced = b.host
		b.host = c
	}
	return replaced
}

func (s *Session) removeIfMatch(c *Client) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.buckets == nil {
		return
	}
	b, ok := s.buckets[c.RoleKey()]
	if !ok || b == nil {
		return
	}
	if c.role == role.Remote && b.remote == c {
		b.remote = nil
	}
	if c.role == role.Host && b.host == c {
		b.host = nil
	}
	if b.remote == nil && b.host == nil {
		delete(s.buckets, c.RoleKey())
	}
}

func (s *Session) empty() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.buckets) == 0
}

func (s *Session) peer(of *Client) *Client {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.buckets == nil {
		return nil
	}
	b, ok := s.buckets[of.RoleKey()]
	if !ok || b == nil {
		return nil
	}
	if of.role == role.Remote {
		return b.host
	}
	return b.remote
}
