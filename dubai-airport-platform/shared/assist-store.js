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
    AWAITING_ASSIGNMENT: 'AWAITING_ASSIGNMENT', // a leg handed off; journey open, needs next agent
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
    AWAITING_ASSIGNMENT: 4,   // between legs — passenger still sees "Assistance in progress"
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
      // Legacy single-owner mirror (kept in sync with the current leg so all
      // existing reads keep working). Multi-agent journey lives in assignments[].
      agentId: null,
      agentName: null,
      assignments: [],                // ordered legs (see assignTask)
      currentAssignmentId: null,      // active leg, or null while awaiting the next
      journeyStepReached: 0,          // monotonic passenger-projection high-water mark
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

  /* ---- Assignment (leg) helpers ---------------------------------------- */
  function currentAssignment(r) {
    if (!r || !Array.isArray(r.assignments)) return null;
    var id = r.currentAssignmentId;
    return r.assignments.filter(function (a) { return a.assignmentId === id; })[0] || null;
  }
  function nextAssignmentId(r) {
    var n = (r && Array.isArray(r.assignments) ? r.assignments.length : 0) + 1;
    return 'ASG-' + n;
  }

  // Coordinator assigns a new leg with full task context. This is the primary
  // multi-agent entry point (first assignment AND every subsequent handoff leg).
  // opts = { agentId, taskTitle, taskInstruction, pickup, destination, isFinal }
  function assignTask(id, opts, actor) {
    opts = opts || {};
    var r = get(id);
    if (!r) return null;
    var a = agentById(opts.agentId);
    var asg = {
      assignmentId: nextAssignmentId(r),
      agentId: opts.agentId,
      agentName: a ? a.name : opts.agentId,
      taskTitle: opts.taskTitle || 'Assist passenger',
      taskInstruction: opts.taskInstruction || '',
      pickup: opts.pickup || r.pickup || '',
      destination: opts.destination || r.destination || '',
      isFinal: !!opts.isFinal,
      status: STATUS.ASSIGNED,
      assignedAt: nowISO(), acceptedAt: null, startedAt: null, completedAt: null,
      handoff: null
    };
    var assignments = (r.assignments || []).slice();
    assignments.push(asg);
    return update(id, {
      assignments: assignments,
      currentAssignmentId: asg.assignmentId,
      agentId: asg.agentId, agentName: asg.agentName,   // mirror current owner
      status: STATUS.ASSIGNED,
      journeyStepReached: Math.max(r.journeyStepReached || 0, 2)
    }, actor || 'coordinator',
      'Assigned to ' + asg.agentName + ' (' + asg.agentId + ') — Task: ' + asg.taskTitle
      + (asg.isFinal ? ' [final leg]' : ' [handoff leg]'));
  }

  // Legacy single-leg assign: defaults to a FINAL leg so single-agent flows
  // complete the journey exactly as before this multi-agent change.
  function assign(id, agentId, actor) {
    var r = get(id);
    return assignTask(id, {
      agentId: agentId,
      taskTitle: (r && r.destination) ? ('Escort to ' + r.destination) : 'Assist passenger',
      pickup: r && r.pickup, destination: r && r.destination,
      isFinal: true
    }, actor);
  }

  // Swap the agent on the CURRENT leg (before it is completed), keeping the task.
  function reassign(id, agentId, actor) {
    var r = get(id);
    var a = agentById(agentId);
    var cur = currentAssignment(r);
    if (!cur) {
      return update(id, { agentId: agentId, agentName: a ? a.name : agentId },
        actor || 'coordinator', 'Reassigned to ' + (a ? a.name : agentId) + ' (' + agentId + ')');
    }
    var assignments = r.assignments.map(function (x) {
      return x.assignmentId === cur.assignmentId
        ? Object.assign({}, x, { agentId: agentId, agentName: a ? a.name : agentId })
        : x;
    });
    return update(id, { assignments: assignments, agentId: agentId, agentName: a ? a.name : agentId },
      actor || 'coordinator',
      'Reassigned to ' + (a ? a.name : agentId) + ' (' + agentId + ') — Task: ' + cur.taskTitle);
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

  // Define the full ordered Assistance Plan up-front: one assignment (leg) per
  // step, each with its own pre-selected agent. Step 1 becomes active; the rest
  // are PENDING and auto-activate on handoff (see handoffPassenger). The number
  // of steps is whatever the coordinator passes — never hardcoded.
  // steps = [{ agentId, taskTitle, taskInstruction, pickup, destination }, ...]
  function setPlan(id, steps, actor) {
    var r = get(id);
    if (!r) return null;
    steps = (steps || []).filter(function (s) { return s && s.agentId; });
    if (!steps.length) return null;
    var assignments = steps.map(function (s, i) {
      var a = agentById(s.agentId);
      return {
        assignmentId: 'ASG-' + (i + 1),
        stepNo: i + 1,
        agentId: s.agentId,
        agentName: a ? a.name : s.agentId,
        taskTitle: s.taskTitle || ('Step ' + (i + 1)),
        taskInstruction: s.taskInstruction || '',
        pickup: s.pickup || '',
        destination: s.destination || '',
        isFinal: i === steps.length - 1,
        status: i === 0 ? STATUS.ASSIGNED : 'PENDING',
        assignedAt: i === 0 ? nowISO() : null,
        acceptedAt: null, startedAt: null, completedAt: null,
        handoff: null
      };
    });
    var first = assignments[0];
    return update(id, {
      assignments: assignments,
      currentAssignmentId: first.assignmentId,
      agentId: first.agentId, agentName: first.agentName,
      status: STATUS.ASSIGNED,
      journeyStepReached: Math.max(r.journeyStepReached || 0, 2)
    }, actor || 'coordinator',
      'Assistance plan set — ' + assignments.length + ' step' + (assignments.length > 1 ? 's' : '')
      + ' · Step 1: ' + first.agentName + ' (' + first.taskTitle + ')');
  }

  /* ---- Agent lifecycle helpers (Phase 3) --------------------------------
     Thin, additive wrappers the Agent app uses to advance a request it is
     assigned to. Each enforces a valid predecessor state (returns null and
     writes nothing on an out-of-order call) and records one audit entry, so
     OCC and the passenger tracker reflect the change automatically. ------- */

  // Advance the CURRENT leg one execution step, mirror it onto the request
  // status, and raise (never lower) the passenger high-water mark. Guards on
  // the current leg's status (falls back to request.status for legacy requests
  // that predate assignments[]).
  function advanceAssignment(id, fromStates, toStatus, stampField, journeyStep, actor, note) {
    var r = get(id);
    if (!r) return null;
    var cur = currentAssignment(r);
    var curStatus = cur ? cur.status : r.status;
    if (fromStates.indexOf(curStatus) === -1) return null; // invalid transition — no-op
    var patch = { status: toStatus };
    if (cur) {
      var updated = Object.assign({}, cur, { status: toStatus });
      if (stampField) updated[stampField] = nowISO();
      patch.assignments = r.assignments.map(function (x) {
        return x.assignmentId === cur.assignmentId ? updated : x;
      });
    }
    if (journeyStep != null) patch.journeyStepReached = Math.max(r.journeyStepReached || 0, journeyStep);
    return update(id, patch, actor || 'agent', note);
  }
  function acceptAssignment(id, actor) {
    return advanceAssignment(id, [STATUS.ASSIGNED], STATUS.ACCEPTED, 'acceptedAt', 2, actor || 'agent', 'Assignment accepted');
  }
  function startEnRoute(id, actor) {
    return advanceAssignment(id, [STATUS.ACCEPTED], STATUS.EN_ROUTE, null, 3, actor || 'agent', 'On the way to the passenger');
  }
  function locatePassenger(id, actor) {
    return advanceAssignment(id, [STATUS.EN_ROUTE], STATUS.PASSENGER_LOCATED, null, 4, actor || 'agent', 'Passenger located');
  }
  function startAssistance(id, actor) {
    return advanceAssignment(id, [STATUS.PASSENGER_LOCATED], STATUS.IN_PROGRESS, 'startedAt', 4, actor || 'agent', 'Assistance started');
  }

  // Complete the FINAL leg → the whole AssistanceRequest is COMPLETED. A leg
  // flagged not-final must hand off instead (returns null here).
  function completeAssistance(id, actor) {
    var r = get(id);
    if (!r) return null;
    var cur = currentAssignment(r);
    var curStatus = cur ? cur.status : r.status;
    if (curStatus !== STATUS.IN_PROGRESS) return null;
    if (cur && !cur.isFinal) return null; // not the final leg — use handoffPassenger
    var patch = { status: STATUS.COMPLETED, journeyStepReached: 5 };
    if (cur) {
      var updated = Object.assign({}, cur, { status: STATUS.COMPLETED, completedAt: nowISO() });
      patch.assignments = r.assignments.map(function (x) {
        return x.assignmentId === cur.assignmentId ? updated : x;
      });
    }
    return update(id, patch, actor || 'agent', 'Assistance completed');
  }

  // Successful handoff → current leg COMPLETED (with handoff record). The
  // journey stays OPEN. If the plan has a next PENDING step, it AUTO-ACTIVATES
  // (its pre-selected agent becomes the current owner and sees the task) — the
  // system never picks the agent, it only activates the coordinator's plan.
  // If no next step is planned, it falls back to AWAITING_ASSIGNMENT.
  function handoffPassenger(id, note, actor) {
    var r = get(id);
    if (!r) return null;
    var cur = currentAssignment(r);
    if (!cur || cur.status !== STATUS.IN_PROGRESS) return null;
    var loc = cur.destination || '';
    var assignments = r.assignments.map(function (x) {
      return x.assignmentId === cur.assignmentId
        ? Object.assign({}, x, { status: STATUS.COMPLETED, completedAt: nowISO(),
            handoff: { status: 'done', note: note || '', at: nowISO(), atLocation: loc } })
        : x;
    });
    // Next pre-planned step, in order.
    var next = assignments
      .filter(function (x) { return x.status === 'PENDING'; })
      .sort(function (a, b) { return (a.stepNo || 0) - (b.stepNo || 0); })[0];
    if (next) {
      assignments = assignments.map(function (x) {
        return x.assignmentId === next.assignmentId
          ? Object.assign({}, x, { status: STATUS.ASSIGNED, assignedAt: nowISO() })
          : x;
      });
      return update(id, {
        assignments: assignments,
        currentAssignmentId: next.assignmentId,
        agentId: next.agentId, agentName: next.agentName,   // next pre-assigned owner
        status: STATUS.ASSIGNED,
        journeyStepReached: Math.max(r.journeyStepReached || 0, 4)
      }, actor || 'agent',
        'Handed off at ' + (loc || 'handoff point') + (note ? ' — ' + note : '')
        + ' · Next: ' + next.agentName + ' (' + next.taskTitle + ')');
    }
    return update(id, {
      assignments: assignments,
      currentAssignmentId: null,
      agentId: null, agentName: null,             // no current owner; needs coordinator
      status: STATUS.AWAITING_ASSIGNMENT,
      journeyStepReached: Math.max(r.journeyStepReached || 0, 4)
    }, actor || 'agent',
      'Handed off at ' + (loc || 'handoff point') + (note ? ' — ' + note : ''));
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
  // Request-aware projection: never regresses across handoffs (uses the
  // monotonic high-water mark). Falls back to the status map for legacy
  // requests that predate journeyStepReached.
  function passengerStepForRequest(r) {
    if (!r) return 0;
    if (r.status === STATUS.CANCELLED) return -1;
    var byStatus = (r.status in STATUS_TO_STEP) ? STATUS_TO_STEP[r.status] : 0;
    var hwm = (typeof r.journeyStepReached === 'number') ? r.journeyStepReached : 0;
    return Math.max(byStatus, hwm);
  }
  function passengerStatusLabelForRequest(r) {
    var i = passengerStepForRequest(r);
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
    assignTask: assignTask,            // task-based assignment (multi-agent)
    setPlan: setPlan,                  // define the full ordered assistance plan
    reassign: reassign,
    escalate: escalate,
    resolveException: resolveException,
    cancel: cancel,
    setPriority: setPriority,
    // assignment helpers
    currentAssignment: currentAssignment,
    // agent lifecycle transitions (Phase 3 + multi-agent)
    acceptAssignment: acceptAssignment,
    startEnRoute: startEnRoute,
    locatePassenger: locatePassenger,
    startAssistance: startAssistance,
    completeAssistance: completeAssistance,
    handoffPassenger: handoffPassenger,
    // passenger session helpers
    getLastId: getLastId,
    setLastId: setLastId,
    clearLastId: clearLastId,
    // lookups
    needByKey: needByKey,
    needLabels: needLabels,
    passengerStepIndex: passengerStepIndex,
    passengerStatusLabel: passengerStatusLabel,
    passengerStepForRequest: passengerStepForRequest,
    passengerStatusLabelForRequest: passengerStatusLabelForRequest
  };
})();
