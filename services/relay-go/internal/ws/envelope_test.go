package ws

import "testing"

func TestValidateEnvelope(t *testing.T) {
	t.Parallel()
	if err := ValidateEnvelope([]byte(`{"type":"system.heartbeat","payload":{},"timestamp":"2026-04-15T00:00:00Z","traceId":"abc"}`)); err != nil {
		t.Fatalf("valid envelope: %v", err)
	}
	if err := ValidateEnvelope([]byte(`{}`)); err == nil {
		t.Fatal("expected error for missing type")
	}
	if err := ValidateEnvelope([]byte(`{"type":""}`)); err == nil {
		t.Fatal("expected error for empty type")
	}
	if err := ValidateEnvelope([]byte(`not json`)); err == nil {
		t.Fatal("expected error for invalid JSON")
	}
}
