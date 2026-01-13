-- Rate limiting for public API protection
CREATE TABLE IF NOT EXISTS rate_limits (
  ip TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window
ON rate_limits(window_start);

-- Cleanup suggestion: periodically delete rows older than 24h
-- DELETE FROM rate_limits WHERE window_start < unixepoch() * 1000 - 86400000;
