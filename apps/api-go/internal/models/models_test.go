package models

import "testing"

func TestTableNames(t *testing.T) {
	cases := []struct {
		model interface{ TableName() string }
		want  string
	}{
		{User{}, "users"},
		{Message{}, "messages"},
		{Thread{}, "threads"},
		{ThreadMessage{}, "thread_messages"},
	}
	for _, tc := range cases {
		if got := tc.model.TableName(); got != tc.want {
			t.Errorf("TableName() = %q, want %q", got, tc.want)
		}
	}
}
