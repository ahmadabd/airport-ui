/* =========================================================
   AeroGate Intelligence Engine
   Phase 1 — Core Engine
   ========================================================= */

(function () {
  "use strict";

  /**
   * Convert HH:MM into minutes.
   * Example: "14:30" -> 870
   */
  function timeToMinutes(time) {
    if (!time || typeof time !== "string") return null;

    const [hours, minutes] = time.split(":").map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    return (hours * 60) + minutes;
  }

  /**
   * Difference between two times.
   */
  function minutesBetween(timeA, timeB) {
    const a = timeToMinutes(timeA);
    const b = timeToMinutes(timeB);

    if (a === null || b === null) return null;

    return Math.abs(a - b);
  }

  /**
   * Public API
   */
  /**
 * Detect gate conflicts.
 * Two flights conflict if:
 * - they use the same gate
 * - departure times are کمتر از 30 دقیقه فاصله داشته باشند.
 */
function detectGateConflicts(flights, threshold = 30) {
  if (!Array.isArray(flights)) return [];

  const conflicts = [];

  for (let i = 0; i < flights.length; i++) {
    for (let j = i + 1; j < flights.length; j++) {

      const first = flights[i];
      const second = flights[j];

      if (first.gate !== second.gate) continue;

      const gap = minutesBetween(first.departure, second.departure);

      if (gap !== null && gap < threshold) {
        conflicts.push({
          gate: first.gate,
          severity: gap < 15 ? "HIGH" : "MEDIUM",
          gap,
          firstFlight: first.flight,
          secondFlight: second.flight
        });
      }
    }
  }

  return conflicts;
}
/**
 * Find available gates.
 * Returns gates that are:
 * - FREE
 * - same terminal
 * - aircraft compatible
 */
function getAvailableGates(gates, flight) {

  if (!Array.isArray(gates) || !flight) return [];

  return gates.filter(gate => {

    const sameTerminal =
      gate.terminal === flight.terminal;

    const compatibleAircraft =
      gate.aircraft.includes(flight.aircraft);

    const free =
      gate.status === "FREE";

    return sameTerminal &&
           compatibleAircraft &&
           free;

  });

}
/**
 * Rank available gates and return the best recommendation.
 */
function recommendBestGate(gates, flight) {

  const available = getAvailableGates(gates, flight);

  const ranked = available.map(gate => {

    let score = 0;
    const reasons = [];

    if (gate.terminal === flight.terminal) {
      score += 50;
      reasons.push("Same terminal");
    }

    if (gate.aircraft.includes(flight.aircraft)) {
      score += 30;
      reasons.push("Aircraft compatible");
    }

    if (gate.status === "FREE") {
      score += 20;
      reasons.push("Gate is free");
    }

    return {
      gate: gate.gate,
      score,
      reasons
    };

  });

  ranked.sort((a, b) => b.score - a.score);

  return ranked;
}
window.GateIntelligence = {
  timeToMinutes,
  minutesBetween,
  detectGateConflicts,
  getAvailableGates,
  recommendBestGate
};

})();