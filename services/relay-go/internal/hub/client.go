package hub

import (
	"sync"

	"github.com/gorilla/websocket"
	"github.com/YI1219/The-Damn-Life/services/relay-go/internal/role"
)

// Client is one WebSocket peer registered with the hub.
type Client struct {
	hub       *Hub
	conn      *websocket.Conn
	send      chan []byte
	sessionID string
	role      role.Role
	roleKey   string
	sendOnce  sync.Once
}

// NewClient constructs a client; the caller must start read/write pumps.
func NewClient(h *Hub, conn *websocket.Conn, sessionID string, r role.Role, key string) *Client {
	return &Client{
		hub:       h,
		conn:      conn,
		send:      make(chan []byte, 256),
		sessionID: sessionID,
		role:      r,
		roleKey:   key,
	}
}

// Hub returns the hub this client belongs to.
func (c *Client) Hub() *Hub { return c.hub }

// Conn exposes the underlying WebSocket (for pumps only).
func (c *Client) Conn() *websocket.Conn { return c.conn }

// Send is the outbound message queue for the write pump (hub forwards here).
func (c *Client) Send() chan<- []byte { return c.send }

// Outbound is the readable side for the WebSocket write pump.
func (c *Client) Outbound() <-chan []byte { return c.send }

// SessionID is the relay-scoped session key for this connection.
func (c *Client) SessionID() string { return c.sessionID }

// RoleKey partitions multiple pairs within the same session (empty means default pair).
func (c *Client) RoleKey() string { return c.roleKey }

// ShutdownSend closes the send channel once so the write pump can exit cleanly.
func (c *Client) ShutdownSend() {
	c.sendOnce.Do(func() {
		close(c.send)
	})
}

func (c *Client) roleRef() role.Role { return c.role }
