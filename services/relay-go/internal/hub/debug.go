package hub

import (
	"log"
	"os"
	"strings"
)

var debugHub = strings.TrimSpace(os.Getenv("RELAY_DEBUG")) == "1"

func debugf(format string, args ...any) {
	if !debugHub {
		return
	}
	log.Printf("[relay-hub] "+format, args...)
}
