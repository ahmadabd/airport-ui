/* ==========================================================================
   DXB Special Assistance — Shared request store & model
   --------------------------------------------------------------------------
   Single source of truth for Special Assistance requests across all three
   surfaces (Passenger companion, OCC Coordinator module, Agent app).

   - Frontend-only. No backend. Persists to localStorage under one key.
   - Exposes a small API on window.AssistStore.
   - Emits a change event so any open surface (this tab or another) re-renders.

   Used by:
     - special-assistance-passenger/  (Phase 1 — this build)
     - pages/special-assistance.html  (OCC, later phase)
     - special-assistance-agent/      (Agent, later phase)
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'DXB_ASSIST_REQUESTS';   // array of AssistanceRequest
  var LAST_ID_KEY = 'DXB_ASSIST_LAST_ID';    // passenger's most recent request id
  var CHANGE_EVENT = 'assist-store:change';  // in-page pub/sub

  /* ---- Reference data (shared vocabulary) -------------------------------- */

  // Passenger-language support needs. `code` is the internal PRM/SSR code used
  // later by the Coordinator; the passenger only ever sees `label`.
  var NEEDS = [
    { key: 'wheelchair_push',    label: 'Wheelchair assistance',            code: 'WCHR', icon: '♿' },
    { key: 'long_walk',          label: 'Help with long walking distances', code: 'WCHS', icon: '🚶' },
    { key: 'cabin_seat_transfer',label: 'Cabin-seat transfer support',      code: 'WCHC', icon: '💺' },
    { key: 'visual',             label: 'Visual assistance',                code: 'BLND', icon: '👁' },
    { key: 'hearing',            label: 'Hearing assistance',               code: 'DEAF', icon: '👂' },
    { key: 'mobility_equipment', label: 'Travelling with mobility equipment',code: 'WCHR', icon: '🧳' },
    { key: 'companion',          label: 'Travelling with a companion',      code: 'MAAS', icon: '👥' },
    { key: 'other',              label: 'Other assistance',                 code: 'MAAS', icon: '➕' }
  ];

  // Internal lifecycle (approved architecture, 8 states + terminal CANCELLED).
  var STATUS = {
    REQUESTED: 'REQUESTED',
    CONFIRMED: 'CONFIRMED',
    ASSIGNED: 'ASSIGNED',
    ACCEPTED: 'ACCEPTED',
    EN_ROUTE: 'EN_ROUTE',
    PASSENGER_LOCATED: 'PASSENGER_LOCATED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED'
  };

  // Passenger-facing projection: 6 friendly steps shown on the tracking screen.
  var PASSENGER_STEPS = [
    { key: 'received',   label: 'Request received' },
    { key: 'confirmed',  label: 'Assistance confirmed' },
    { key: 'assigned',   label: 'Agent assigned' },
    { key: 'on_the_way', label: 'Agent on the way' },
    { key: 'in_progress',label: 'Assistance in progress' },
    { key: 'completed',  label: 'Completed' }
  ];

  // Map internal state -> index into PASSENGER_STEPS (which friendly step is "current").
  var STATUS_TO_STEP = {
    REQUESTED: 0,
    CONFIRMED: 1,
    ASSIGNED: 2,
    ACCEPTED: 2,
    EN_ROUTE: 3,
    PASSENGER_LOCATED: 4,
    IN_PROGRESS: 4,
    COMPLETED: 5,
    CANCELLED: -1
  };

  // Assistance agents (mock roster). Reused by the OCC module now and the
  // Agent app later, so all surfaces reference the same people/ids.
  var AGENTS = [
    { id: 'AG-21', name: 'Omar Farouk',   zone: 'T3 · Concourse B', skills: ['WCHR','WCHS','WCHC'], status: 'available' },
    { id: 'AG-14', name: 'Priya Nair',    zone: 'T3 · Concourse A', skills: ['WCHR','WCHS','BLND'], status: 'available' },
    { id: 'AG-33', name: 'Mateen Khan',   zone: 'T2 · Main',        skills: ['WCHR','WCHS'],        status: 'available' },
    { id: 'AG-42', name: 'Elena Petrova', zone: 'T3 · Concourse C', skills: ['WCHR','WCHC','DEAF'], status: 'on_task' },
    { id: 'AG-08', name: 'Yusuf Rahman',  zone: 'T1 · Arrivals',    skills: ['WCHR','WCHS','MAAS'], status: 'available' }
  ];
  function agentById(id) {
    return AGENTS.filter(function (a) { return a.id === id; })[0] || null;
  }

  /* ---- Persistence helpers ---------------------------------------------- */

  function readAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function writeAll(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    emitChange();
  }

  function emitChange() {
    try {
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    } catch (e) { /* older browsers */ }
  }

  // Cross-tab: a write in another tab fires `storage`; re-broadcast in-page.
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) emitChange();
  });

  /* ---- IDs & time -------------------------------------------------------- */

  function nextId() {
    var list = readAll();
    var max = 1041; // so the first request reads SA-1042 (matches the design docs)
    list.forEach(function (r) {
      var n = parseInt(String(r.id).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return 'SA-' + (max + 1);
  }

  function nowISO() {
    return new Date().toISOString();
  }

  /* ---- Model builder ----------------------------------------------------- */

  // Build a fully-formed AssistanceRequest from passenger input + booking ctx.
  // input = { passenger:{name,bookingRef}, flight:{...}, needs:[keys],
  //           needsNote, pickup, destination }
  function buildRequest(input) {
    input = input || {};
    var flight = input.flight || {};
    var passenger = input.passenger || {};
    var checkpoints = [
      { key: 'pickup',   label: 'Passenger located',   done: false, handoff: false },
      { key: 'security', label: 'Arrived at security', done: false, handoff: false },
      { key: 'gate',     label: 'Arrived at gate',     done: false, handoff: true }
    ];
    return {
      id: nextId(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
      status: STATUS.REQUESTED,
      source: input.source || 'passenger_app',
      passenger: {
        name: passenger.name || 'Guest passenger',
        bookingRef: passenger.bookingRef || ''
      },
      flight: {
        number: flight.number || '',
        route: flight.route || '',
        terminal: flight.terminal || '',
        gate: flight.gate || '',
        date: flight.date || '',
        boarding: flight.boarding || '',
        journeyType: flight.journeyType || 'departing'
      },
      needs: Array.isArray(input.needs) ? input.needs.slice() : [],
      needsNote: input.needsNote || '',
      pickup: input.pickup || '',
      destination: input.destination || flight.gate || '',
      priority: 'P3',                 // baseline; Coordinator may raise later
      sla: { dueBy: flight.boarding || '', state: 'on_track' },
      agentId: null,
      checkpoints: checkpoints,
      currentCheckpoint: 0,
      exception: null,
      timeline: [
        { ts: nowISO(), actor: 'passenger', event: 'Request submitted' }
      ]
    };
  }

  /* ---- Public API -------------------------------------------------------- */

  function all() {
    return readAll();
  }

  function get(id) {
    return readAll().filter(function (r) { return r.id === id; })[0] || null;
  }

  // Create + persist a new request. Returns the stored request.
  function create(input) {
    var req = buildRequest(input);
    var list = readAll();
    list.push(req);
    writeAll(list);
    setLastId(req.id);
    return req;
  }

  // Patch an existing request (used by OCC/Agent later). Adds a timeline entry
  // automatically when `status` changes.
  function update(id, patch, actor, note) {
    var list = readAll();
    var changed = null;
    list = list.map(function (r) {
      if (r.id !== id) return r;
      var before = r.status;
      var merged = Object.assign({}, r, patch, { updatedAt: nowISO() });
      merged.timeline = (r.timeline || []).slice();
      if (note) {
        merged.timeline.push({ ts: nowISO(), actor: actor || 'system', event: note });
      } else if (patch && patch.status && patch.status !== before) {
        merged.timeline.push({
          ts: nowISO(),
          actor: actor || 'system',
          event: 'Status → ' + patch.status
        });
      }
      changed = merged;
      return merged;
    });
    if (changed) writeAll(list);
    return changed;
  }

  /* ---- Coordinator / agent transition helpers ---------------------------
     Thin wrappers over update() so OCC and the Agent app share identical
     transitions. Each writes one human-readable timeline entry. ---------- */

  function confirmRequest(id, actor) {
    return update(id, { status: STATUS.CONFIRMED }, actor || 'coordinator', 'Request confirmed');
  }
  function assign(id, agentId, actor) {
    var a = agentById(agentId);
    return update(id, {
      agentId: agentId, agentName: a ? a.name : agentId, status: STATUS.ASSIGNED
    }, actor || 'coordinator', 'Assigned to ' + (a ? a.name : agentId) + ' (' + agentId + ')');
  }
  function reassign(id, agentId, actor) {
    var a = agentById(agentId);
    return update(id, {
      agentId: agentId, agentName: a ? a.name : agentId
    }, actor || 'coordinator', 'Reassigned to ' + (a ? a.name : agentId) + ' (' + agentId + ')');
  }
  function escalate(id, type, note, actor) {
    var patch = { exception: { type: type, note: note || '', openedAt: nowISO(), status: 'open' } };
    var cur = get(id);
    if (type === 'sla_risk') {
      patch.sla = Object.assign({}, (cur && cur.sla) || {}, { state: 'at_risk' });
    }
    return update(id, patch, actor || 'coordinator',
      'Exception raised: ' + type + (note ? ' — ' + note : ''));
  }
  function resolveException(id, actor) {
    var cur = get(id);
    var patch = { exception: null };
    if (cur && cur.sla && cur.sla.state === 'at_risk') {
      patch.sla = Object.assign({}, cur.sla, { state: 'on_track' });
    }
    return update(id, patch, actor || 'coordinator', 'Exception resolved');
  }
  function cancel(id, actor, reason) {
    return update(id, { status: STATUS.CANCELLED }, actor || 'coordinator',
      'Request cancelled' + (reason ? ' — ' + reason : ''));
  }
  function setPriority(id, p, actor) {
    return update(id, { priority: p }, actor || 'coordinator', 'Priority set to ' + p);
  }

  /* ---- Agent lifecycle helpers (Phase 3) --------------------------------
     Thin, additive wrappers the Agent app uses to advance a request it is
     assigned to. Each enforces a valid predecessor state (returns null and
     writes nothing on an out-of-order call) and records one audit entry, so
     OCC and the passenger tracker reflect the change automatically. ------- */

  function agentTransition(id, fromStates, toStatus, actor, note) {
    var cur = get(id);
    if (!cur) return null;
    if (fromStates.indexOf(cur.status) === -1) return null; // invalid transition — no-op
    return update(id, { status: toStatus }, actor || 'agent', note);
  }
  function acceptAssignment(id, actor) {
    return agentTransition(id, [STATUS.ASSIGNED], STATUS.ACCEPTED, actor || 'agent', 'Assignment accepted');
  }
  function startEnRoute(id, actor) {
    return agentTransition(id, [STATUS.ACCEPTED], STATUS.EN_ROUTE, actor || 'agent', 'On the way to the passenger');
  }
  function locatePassenger(id, actor) {
    return agentTransition(id, [STATUS.EN_ROUTE], STATUS.PASSENGER_LOCATED, actor || 'agent', 'Passenger located');
  }
  function startAssistance(id, actor) {
    return agentTransition(id, [STATUS.PASSENGER_LOCATED], STATUS.IN_PROGRESS, actor || 'agent', 'Assistance started');
  }
  function completeAssistance(id, actor) {
    return agentTransition(id, [STATUS.IN_PROGRESS], STATUS.COMPLETED, actor || 'agent', 'Assistance completed');
  }

  function subscribe(fn) {
    window.addEventListener(CHANGE_EVENT, fn);
    return function () { window.removeEventListener(CHANGE_EVENT, fn); };
  }

  function setLastId(id) {
    try { localStorage.setItem(LAST_ID_KEY, id); } catch (e) {}
  }
  function getLastId() {
    try { return localStorage.getItem(LAST_ID_KEY); } catch (e) { return null; }
  }
  function clearLastId() {
    try { localStorage.removeItem(LAST_ID_KEY); } catch (e) {}
  }

  /* ---- Lookups / projections -------------------------------------------- */

  function needByKey(key) {
    return NEEDS.filter(function (n) { return n.key === key; })[0] || null;
  }
  function needLabels(keys) {
    return (keys || []).map(function (k) {
      var n = needByKey(k);
      return n ? n.label : k;
    });
  }
  function passengerStepIndex(status) {
    return (status in STATUS_TO_STEP) ? STATUS_TO_STEP[status] : 0;
  }
  function passengerStatusLabel(status) {
    var i = passengerStepIndex(status);
    if (i < 0) return 'Cancelled';
    return PASSENGER_STEPS[i] ? PASSENGER_STEPS[i].label : 'Request received';
  }

  window.AssistStore = {
    // constants
    STORAGE_KEY: STORAGE_KEY,
    CHANGE_EVENT: CHANGE_EVENT,
    NEEDS: NEEDS,
    STATUS: STATUS,
    PASSENGER_STEPS: PASSENGER_STEPS,
    AGENTS: AGENTS,
    agentById: agentById,
    // core
    all: all,
    get: get,
    create: create,
    update: update,
    subscribe: subscribe,
    // coordinator transitions
    confirmRequest: confirmRequest,
    assign: assign,
    reassign: reassign,
    escalate: escalate,
    resolveException: resolveException,
    cancel: cancel,
    setPriority: setPriority,
    // agent lifecycle transitions (Phase 3)
    acceptAssignment: acceptAssignment,
    startEnRoute: startEnRoute,
    locatePassenger: locatePassenger,
    startAssistance: startAssistance,
    completeAssistance: completeAssistance,
    // passenger session helpers
    getLastId: getLastId,
    setLastId: setLastId,
    clearLastId: clearLastId,
    // lookups
    needByKey: needByKey,
    needLabels: needLabels,
    passengerStepIndex: passengerStepIndex,
    passengerStatusLabel: passengerStatusLabel
  };
})();
