export interface TelemetryData {
  rttMs: number;
  jitterMs: number;
  packetLossRate: number; // 0.0 to 1.0
  bandwidthKbps?: number;
  timestamp: number; // NTP synced
}
