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

const gateCapabilities = {
  A01: ["A380-800", "B777-300ER"],
  A02: ["A380-800", "B777-300ER"],
  A03: ["A380-800", "B777-300ER"],
  A04: ["A380-800", "B777-300ER"],

  B07: ["A350-900", "B777-300ER"],
  B12: ["A350-900", "B777-300ER"],

  C05: ["A350-900", "B777-300ER"],
  C07: ["A350-900", "B777-300ER"],

  D14: ["A380-800", "B777-300ER"],
  E02: ["A350-900", "B777-300ER"]
};

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

  const supportedAircraft =
  gateCapabilities[gate.gate] || [];

const compatibleAircraft =
  supportedAircraft.includes(flight.aircraft);

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

    const supportedAircraft =
  gateCapabilities[gate.gate] || [];

if (supportedAircraft.includes(flight.aircraft)) {
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
function renderGateRecommendation() {

  const container = document.getElementById("gate-ai-recommendation");

  if (!container) return;

const tableData = getGateTableData();
const conflict = getActiveGateConflict();

if (!conflict) {
  container.innerHTML = `
    <div style="padding:24px;">
      <p class="supporting-text">
        No active gate conflict detected.
      </p>
    </div>
  `;
  return;
}

const gates = tableData.map(item => ({
  gate: item.gate,
  terminal: item.terminal,
  aircraft: [item.aircraft],
  status: item.status === "Available" ? "FREE" : "OCCUPIED"
}));

const flight = {
  flight: conflict.flight,
  terminal: conflict.terminal,
  aircraft: conflict.aircraft
};

  const recommendations = recommendBestGate(gates, flight);

  if (!recommendations.length) {
    container.innerHTML = `
      <div style="padding:24px;">
        <p class="supporting-text">
          No suitable alternative gate was found.
        </p>
      </div>
    `;
    return;
  }

  const best = recommendations[0];

  container.innerHTML = `
    <div style="padding:24px;">

      <div style="font-size:14px; margin-bottom:8px;">
        Conflict detected for <strong>${flight.flight}</strong>
      </div>

      <div style="font-size:24px; font-weight:700; margin-bottom:12px;">
        Recommended Gate: ${best.gate}
      </div>

      <div style="margin-bottom:12px;">
        Recommendation Score: <strong>${best.score}/100</strong>
      </div>

      <div style="margin-bottom:16px;">
        ${best.reasons.map(reason => `
          <div>✓ ${reason}</div>
        `).join("")}
      </div>

      <button
  class="btn btn-primary"
  onclick="GateIntelligence.reviewRecommendation()"
>
  Review Recommendation
</button>

    </div>
  `;
}

function reviewRecommendation() {
  const container = document.getElementById("gate-ai-recommendation");

  if (!container) return;

  container.innerHTML = `
    <div style="padding:24px;">

      <div style="font-size:14px; margin-bottom:8px;">
        Recommended operational action
      </div>

      <div style="font-size:24px; font-weight:700; margin-bottom:12px;">
        Move EK203 from A14 to A12
      </div>

      <div style="margin-bottom:16px;">
        <strong>Reason for recommendation:</strong>
      </div>

      <div style="margin-bottom:20px; line-height:1.9;">
        <div>✓ Gate A12 is currently available</div>
        <div>✓ Same terminal: T3</div>
        <div>✓ Compatible with B777</div>
        <div>✓ No operational overlap detected</div>
      </div>

      <div style="display:flex; gap:12px;">

        <button
          class="btn btn-primary"
          onclick="GateIntelligence.acceptRecommendation()"
        >
          Accept Recommendation
        </button>

        <button
          class="btn btn-secondary"
          onclick="GateIntelligence.rejectRecommendation()"
        >
          Reject
        </button>

      </div>

    </div>
  `;
}

function acceptRecommendation() {
  const container = document.getElementById("gate-ai-recommendation");

  if (!container) return;

const conflict = getActiveGateConflict();

if (conflict) {
  const row = document.querySelector(
    `tr[data-flight="${conflict.flight}"]`
  );

  if (row) {
    row.dataset.gate = "A03";
    row.dataset.status = "Assigned";

    const cells = row.querySelectorAll("td");

    if (cells[0]) {
      const gateCode = cells[0].querySelector(".gate-code");
      if (gateCode) {
        gateCode.textContent = "A03";
      }
    }

    if (cells[4]) {
      cells[4].innerHTML = `
        <span class="chip chip-info">
          Assigned
        </span>
      `;
    }
  }
}
const remainingConflict = getActiveGateConflict();
const resolvedAlert = document.querySelector(
  '[data-alert-gate="A04"]'
);

if (resolvedAlert) {
  resolvedAlert.remove();
}

const alertCount = document.getElementById("operational-alert-count");
const remainingAlerts = document.querySelectorAll(".gate-alert-item").length;

if (alertCount) {
  alertCount.textContent = `${remainingAlerts} Attention Required`;
}
  container.innerHTML = `
  <div style="padding:24px;">

    <div style="font-size:14px; margin-bottom:8px;">
      Recommendation approved by Gate Operations Controller
    </div>

    <div style="font-size:24px; font-weight:700; margin-bottom:12px;">
      EK412 reassigned to Gate A03
    </div>

    <div style="margin-bottom:16px;">
      ${
        remainingConflict
          ? "Another active conflict still requires review."
          : "No active gate conflicts detected."
      }
    </div>

    <div style="line-height:1.9;">
      <div>✓ Previous Gate: A04</div>
      <div>✓ New Gate: A03</div>
      <div>✓ Conflict resolved</div>
      <div>✓ Controller approval recorded</div>
      <div>✓ Operational analysis refreshed</div>
    </div>

  </div>
`;
    }
function rejectRecommendation() {
  const container = document.getElementById("gate-ai-recommendation");

  if (!container) return;

  container.innerHTML = `
    <div style="padding:24px;">

      <div style="font-size:14px; margin-bottom:8px;">
        Recommendation rejected by Gate Operations Controller
      </div>

      <div style="font-size:24px; font-weight:700; margin-bottom:12px;">
        No gate reassignment was applied
      </div>

      <div style="margin-bottom:16px;">
        The detected conflict remains active and requires manual review.
      </div>

      <button
        class="btn btn-primary"
        onclick="GateIntelligence.renderGateRecommendation()"
      >
        Review Alternatives
      </button>

    </div>
  `;
}

function getGateTableData() {
  const rows = document.querySelectorAll(
    'tr[data-gate][data-flight]'
  );

  return Array.from(rows).map(row => {
    const cells = row.querySelectorAll('td');

    return {
      gate: row.dataset.gate,
      flight: row.dataset.flight,
      route: row.dataset.route,
      status: row.dataset.status,
      terminal: row.dataset.terminal,
      timeWindow: row.dataset.time,

      aircraft: cells[3]?.innerText.trim() || "",
      boardingTime: cells[5]?.innerText.trim() || "",
      departureTime: cells[6]?.innerText.trim() || ""
    };
  });
}

function getActiveGateConflict() {
  const flights = getGateTableData();

  return flights.find(
    flight => flight.status === "Conflict"
  ) || null;
}

window.GateIntelligence = {
  timeToMinutes,
  minutesBetween,
  detectGateConflicts,
  getAvailableGates,
  recommendBestGate,
  renderGateRecommendation,
  reviewRecommendation,
  acceptRecommendation,
  rejectRecommendation,
  getGateTableData,
  getActiveGateConflict
};

})();