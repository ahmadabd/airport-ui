/**
 * DXB Tower Smart Hub — Emirates white/red UI
 * Mounted inside OCC ops-content when Tower module opens
 */
window.TowerHub = (function () {
  let flights
  let recommendations
  let activeTab = 'arr'
  let selectedId = 'UAE123'
  let conflictActive = true
  let clockTimer = null
  let motionTimer = null
  let root = null
  let bound = false

  function resetData() {
    flights = {
      arr: [
        { id: 'EK123', callsign: 'UAE123', type: 'A388', from: 'LHR', rwy: '12L', eta: '14:02', status: 'FINAL', wake: 'HEAVY', seq: 1, alert: true, x: 28, y: 28, hdg: 120, kind: 'arr' },
        { id: 'QR456', callsign: 'QTR456', type: 'A359', from: 'DOH', rwy: '12L', eta: '14:05', status: 'APP', wake: 'HEAVY', seq: 2, x: 42, y: 24, hdg: 118, kind: 'arr' },
        { id: 'BA789', callsign: 'BAW789', type: 'B789', from: 'LHR', rwy: '12R', eta: '14:08', status: 'APP', wake: 'MEDIUM', seq: 3, x: 58, y: 68, hdg: 122, kind: 'arr' },
        { id: 'LH221', callsign: 'DLH221', type: 'A321', from: 'FRA', rwy: '12L', eta: '14:11', status: 'SEQ', wake: 'MEDIUM', seq: 4, x: 72, y: 20, hdg: 120, kind: 'arr' },
      ],
      dep: [
        { id: 'EK501', callsign: 'UAE501', type: 'B77W', to: 'CDG', rwy: '12L', etd: '11:20Z', status: 'DELAYED (+9m)', wake: 'HEAVY', seq: 1, alert: true, x: 24, y: 56, hdg: 45, kind: 'gnd' },
        { id: 'EK303', callsign: 'UAE303', type: 'A359', to: 'FRA', rwy: '12L', etd: '11:35Z', status: 'DELAYED (+15m)', wake: 'HEAVY', seq: 2, alert: true, x: 18, y: 64, hdg: 45, kind: 'gnd' },
        { id: 'EK205', callsign: 'UAE205', type: 'B77W', to: 'JFK', rwy: '12R', etd: '14:03', status: 'ROLLOUT', wake: 'HEAVY', seq: 3, x: 55, y: 72, hdg: 120, kind: 'dep' },
        { id: 'FZ312', callsign: 'FDB312', type: 'B738', to: 'CAI', rwy: '12L', etd: '14:06', status: 'HOLD SHORT', wake: 'MEDIUM', seq: 4, x: 22, y: 48, hdg: 30, kind: 'gnd' },
        { id: 'FR882', callsign: 'RYR882', type: 'B738', to: 'BUD', rwy: '12R', etd: '14:14', status: 'PUSHBACK', wake: 'MEDIUM', seq: 5, x: 12, y: 78, hdg: 90, kind: 'gnd' },
      ],
    }
    recommendations = [
      {
        id: 'rec-1',
        title: 'Go-Around · EK123 (UAE123)',
        body: 'Predicted runway conflict on 12L: hold-short / FZ312 vs arrival on short final. Recommend go-around.',
        rationale: 'CD&R · ETA conflict window 42s',
        level: 'critical',
        action: 'Issue Go-Around',
        resolved: false,
      },
      {
        id: 'rec-4',
        title: 'Slot Reassign · EK 501 ➔ 12R (11:29Z)',
        body: 'Baggage loading delay (+9m) at Gate B22. Reroute departure to 12R at 11:29Z to bypass 12L pushback congestion.',
        rationale: 'DMAN slot swap · 11:29Z slot available',
        level: 'priority',
        action: 'Reassign 12R',
        resolved: false,
      },
      {
        id: 'rec-5',
        title: 'Slot Reassign · EK 303 ➔ 12L (11:50Z)',
        body: 'Refueling delay (+15m) at Gate B07. Resequence departure slot to 11:50Z on 12L.',
        rationale: 'DMAN pushback sequence · 11:50Z clearance',
        level: 'priority',
        action: 'Reassign 12L',
        resolved: false,
      },
      {
        id: 'rec-2',
        title: 'Sequence swap · BAW789 ↔ DLH221',
        body: 'AMAN suggests landing BAW789 on 12R first to preserve wake separation and raise throughput.',
        rationale: 'AMAN/DMAN · +1 slot gain',
        level: 'priority',
        action: 'Approve Sequence',
        resolved: false,
      },
      {
        id: 'rec-3',
        title: 'Clear FDB312 line-up 12L',
        body: 'After UAE123 resolves, clear FDB312 to line up and wait. Confirm RVR for LVO departure.',
        rationale: 'RVR 12L 1,800 m · LVO active',
        level: 'normal',
        action: 'Line Up & Wait',
        resolved: false,
      },
    ]
    activeTab = 'arr'
    selectedId = 'UAE123'
    conflictActive = true
  }

  function $(id) {
    return root ? root.querySelector('#' + id) : document.getElementById(id)
  }

  function qsa(sel) {
    return root ? Array.from(root.querySelectorAll(sel)) : []
  }

  function showToast(message) {
    const el = $('th-toast')
    if (!el) return
    el.textContent = message
    el.hidden = false
    clearTimeout(showToast._t)
    showToast._t = setTimeout(() => {
      el.hidden = true
    }, 2800)
  }

  function updateClock() {
    const el = $('th-clock')
    if (!el) return
    const now = new Date()
    el.textContent =
      `${String(now.getUTCHours()).padStart(2, '0')}:` +
      `${String(now.getUTCMinutes()).padStart(2, '0')}:` +
      `${String(now.getUTCSeconds()).padStart(2, '0')}Z`
  }

  function allFlights() {
    return [...flights.arr, ...flights.dep]
  }

  function renderStrips() {
    const list = $('th-strip-list')
    if (!list) return
    list.innerHTML = ''
    flights[activeTab].forEach((f) => {
      const el = document.createElement('article')
      const isDep = activeTab === 'dep' || f.kind === 'dep'
      el.className = `th-strip ${isDep ? 'dep' : 'arr'}${f.alert ? ' alert' : ''}${selectedId === f.id ? ' selected' : ''}`
      const route = activeTab === 'arr' ? `FROM <b>${f.from}</b>` : `TO <b>${f.to}</b>`
      const time = activeTab === 'arr' ? `ETA <b>${f.eta}</b>` : `ETD <b>${f.etd}</b>`
      el.innerHTML = `
        <div class="th-strip-bar"></div>
        <div>
          <div><span class="th-strip-cs">${f.id}</span><span class="th-strip-type">${f.type} · ${f.wake} ${f.callsign ? '· <span style="font-size:0.75rem;color:var(--text-secondary,#888)">' + f.callsign + '</span>' : ''}</span></div>
          <div class="th-strip-meta"><span>${route}</span><span>RWY <b>${f.rwy}</b></span><span>${time}</span></div>
        </div>
        <div style="text-align:right">
          <div style="font-size:0.7rem;color:var(--th-dim);margin-bottom:6px">#${f.seq}</div>
          <span class="th-strip-tag">${f.status}</span>
        </div>`
      el.addEventListener('click', () => {
        selectedId = f.id
        renderStrips()
        renderAircraft()
        showToast(`Selected ${f.id}`)
      })
      list.appendChild(el)
    })
  }

  function renderAircraft() {
    const layer = $('th-aircraft-layer')
    if (!layer) return
    layer.innerHTML = ''
    allFlights().forEach((f) => {
      const m = document.createElement('div')
      const kind = f.alert && conflictActive ? 'alert' : f.kind
      m.className = `th-ac ${kind}${selectedId === f.id ? ' selected' : ''}`
      m.style.left = `${f.x}%`
      m.style.top = `${f.y}%`
      m.innerHTML = `<div class="glyph" style="transform:rotate(${f.hdg - 90}deg)"></div><span class="callsign">${f.id}</span>`
      m.addEventListener('click', (e) => {
        e.stopPropagation()
        selectedId = f.id
        activeTab = flights.arr.some((a) => a.id === f.id) ? 'arr' : 'dep'
        qsa('.th-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === activeTab))
        renderStrips()
        renderAircraft()
      })
      layer.appendChild(m)
    })
  }

  function renderRecommendations() {
    const queue = $('th-ai-queue')
    if (!queue) return
    queue.innerHTML = ''
    recommendations.forEach((r) => {
      if (r.resolved) return
      const card = document.createElement('article')
      card.className = `th-ai-card ${r.level === 'critical' ? 'critical' : r.level === 'priority' ? 'priority' : ''}`
      card.innerHTML = `
        <div class="th-ai-card-head">
          <h3>${r.title}</h3>
          <span class="th-ai-prio">${r.level.toUpperCase()}</span>
        </div>
        <p>${r.body}</p>
        <p class="th-ai-rationale">${r.rationale}</p>
        <div class="th-ai-actions">
          <button class="th-btn th-btn-primary" type="button" data-approve="${r.id}">${r.action}</button>
          <button class="th-btn th-btn-ghost" type="button" data-reject="${r.id}">Defer</button>
        </div>`
      queue.appendChild(card)
    })
    if (!queue.children.length)
      queue.innerHTML = `<p style="color:var(--th-muted);font-size:0.85rem;">No pending suggestions — sequence stable.</p>`
  }

  function setConflictUI(active) {
    conflictActive = active
    const banner = $('th-alert-banner')
    const zone = $('th-conflict-zone')
    if (banner) banner.hidden = !active
    if (zone) zone.hidden = !active
    const occ = $('th-occ-12l')
    const occMeta = $('th-occ-12l-meta')
    const chip = $('th-state-12l')
    if (active) {
      if (occ) {
        occ.textContent = 'CONFLICT'
        occ.className = 'th-occ-status conflict'
      }
      if (occMeta) occMeta.textContent = 'UAE123 · short final'
      if (chip) {
        chip.textContent = 'ALERT'
        chip.className = 'th-rwy-state danger'
      }
    } else {
      if (occ) {
        occ.textContent = 'CLEAR'
        occ.className = 'th-occ-status clear'
      }
      if (occMeta) occMeta.textContent = 'No occupancy'
      if (chip) {
        chip.textContent = 'ACTIVE'
        chip.className = 'th-rwy-state ok'
      }
      const uae = flights.arr.find((f) => f.id === 'UAE123')
      if (uae) {
        uae.alert = false
        uae.status = 'GO-AROUND'
        uae.y = 18
        uae.x = 35
      }
    }
    renderAircraft()
    renderStrips()
  }

  function approveRecommendation(id) {
    const rec = recommendations.find((r) => r.id === id)
    if (!rec || rec.resolved) return
    rec.resolved = true
    if (id === 'rec-1') {
      setConflictUI(false)
      showToast('Go-Around approved · UAE123')
    } else if (id === 'rec-4') {
      reassignFlightSlot('EK 501', '12R', '11:29Z')
      const topBtn = document.getElementById('btn-reassign-tower-ek501')
      if (topBtn) topBtn.style.display = 'none'
    } else if (id === 'rec-5') {
      reassignFlightSlot('EK 303', '12L', '11:50Z')
      const topBtn = document.getElementById('btn-reassign-tower-ek303')
      if (topBtn) topBtn.style.display = 'none'
    } else if (id === 'rec-2') {
      const a = flights.arr.find((f) => f.id === 'BAW789')
      const b = flights.arr.find((f) => f.id === 'DLH221')
      if (a && b) {
        const tmp = a.seq
        a.seq = b.seq
        b.seq = tmp
        flights.arr.sort((x, y) => x.seq - y.seq)
      }
      showToast('Sequence swap approved')
      renderStrips()
    } else if (id === 'rec-3') {
      const f = flights.dep.find((d) => d.id === 'FDB312')
      if (f) {
        f.status = 'LINE UP'
        f.kind = 'dep'
        f.x = 30
        f.y = 30
        f.hdg = 120
      }
      showToast('Line-up · FDB312 · 12L')
      renderAircraft()
      renderStrips()
    }
    renderRecommendations()
  }

  function rejectRecommendation(id) {
    const rec = recommendations.find((r) => r.id === id)
    if (!rec) return
    rec.resolved = true
    showToast(`Deferred · ${rec.title}`)
    renderRecommendations()
  }

  function issueClearance(type) {
    const labels = {
      'line-up': 'Line Up & Wait',
      takeoff: 'Cleared Takeoff',
      land: 'Cleared to Land',
      hold: 'Hold Short',
    }
    if (!selectedId) {
      showToast('Select an aircraft first')
      return
    }
    showToast(`${labels[type] || type} · ${selectedId}`)
    const f = allFlights().find((x) => x.id === selectedId)
    if (!f) return
    if (type === 'line-up') f.status = 'LINE UP'
    if (type === 'takeoff') f.status = 'DEP'
    if (type === 'land') f.status = 'LAND'
    if (type === 'hold') f.status = 'HOLD SHORT'
    renderStrips()
  }

  function simulateMotion() {
    if (!root || !document.body.contains(root)) return
    flights.arr.forEach((f) => {
      if (f.status === 'GO-AROUND') {
        f.x = Math.min(88, f.x + 0.35)
        f.y = Math.max(8, f.y - 0.15)
        return
      }
      if (f.kind === 'arr' && !f.alert) f.x = Math.max(20, f.x - 0.12)
    })
    const ek = flights.dep.find((d) => d.id === 'EK205')
    if (ek && ek.status === 'ROLLOUT') ek.x = Math.min(82, ek.x + 0.18)
    renderAircraft()
  }

  function onKey(e) {
    if (!root || !document.body.contains(root)) return
    if (e.target.matches('input, textarea')) return
    if (e.key === 'a' || e.key === 'A') {
      const next = recommendations.find((r) => !r.resolved)
      if (next) approveRecommendation(next.id)
    }
    if ((e.key === 'c' || e.key === 'C') && !conflictActive) {
      const uae = flights.arr.find((f) => f.id === 'UAE123')
      if (uae) {
        uae.alert = true
        uae.status = 'FINAL'
        uae.x = 28
        uae.y = 28
      }
      const rec = recommendations.find((r) => r.id === 'rec-1')
      if (rec) rec.resolved = false
      setConflictUI(true)
      renderRecommendations()
      showToast('Conflict demo re-triggered')
    }
  }

  function bindUI() {
    qsa('.th-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab
        qsa('.th-tab').forEach((t) => t.classList.toggle('active', t === tab))
        renderStrips()
      })
    })
    qsa('.th-rwy-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        qsa('.th-rwy-chip').forEach((c) => c.classList.remove('active'))
        chip.classList.add('active')
        showToast(`Focus runway ${chip.dataset.rwy}`)
      })
    })
    const queue = $('th-ai-queue')
    if (queue) {
      queue.addEventListener('click', (e) => {
        const approve = e.target.closest('[data-approve]')
        const reject = e.target.closest('[data-reject]')
        if (approve) approveRecommendation(approve.dataset.approve)
        if (reject) rejectRecommendation(reject.dataset.reject)
      })
    }
    const go = $('th-btn-go-around')
    if (go) go.addEventListener('click', () => approveRecommendation('rec-1'))
    const dismiss = $('th-btn-dismiss-alert')
    if (dismiss)
      dismiss.addEventListener('click', () => {
        const banner = $('th-alert-banner')
        if (banner) banner.hidden = true
        showToast('Alert acknowledged')
      })
    qsa('.th-qa-btn').forEach((btn) => {
      btn.addEventListener('click', () => issueClearance(btn.dataset.clearance))
    })
    if (!bound) {
      document.addEventListener('keydown', onKey)
      bound = true
    }
  }

  function destroyTimers() {
    if (clockTimer) clearInterval(clockTimer)
    if (motionTimer) clearInterval(motionTimer)
    clockTimer = null
    motionTimer = null
  }

  function reassignFlightSlot(flightCode, newRunway, newSlot) {
    if (!flights || !flights.dep) return
    const flightId = flightCode.replace(/\s+/g, '').replace('EK', 'UAE')
    const f = flights.dep.find(d => d.id === flightId || d.id === flightCode || d.id === flightCode.replace(' ', ''))
    if (f) {
      f.rwy = newRunway
      f.etd = newSlot
      f.status = 'PUSHBACK'
      f.alert = false
      if (newRunway === '12R') {
        f.x = 45
        f.y = 72
        f.hdg = 120
      }
    }
    const recId = flightCode.includes('501') ? 'rec-4' : flightCode.includes('303') ? 'rec-5' : null
    if (recId && recommendations) {
      const rec = recommendations.find(r => r.id === recId)
      if (rec) rec.resolved = true
    }
    renderStrips()
    renderAircraft()
    renderRecommendations()
    showToast(`Slot reassigned: ${flightCode} ➔ RWY ${newRunway} (${newSlot})`)
  }

  function focusFlight(flightCode) {
    if (!flights) return
    const code = flightCode.replace(/\s+/g, '').toUpperCase()
    const target = allFlights().find(f => f.id === code || (f.callsign && f.callsign === code) || code.includes(f.id) || f.id.includes(code))
    if (target) {
      selectedId = target.id
      activeTab = flights.arr.some((a) => a.id === target.id) ? 'arr' : 'dep'
      qsa('.th-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === activeTab))
      renderStrips()
      renderAircraft()
      showToast(`Focused ${target.id} (${target.kind === 'arr' ? 'Arrival' : 'Departure'}) · RWY ${target.rwy}`)
    }
  }

  function init() {
    root = document.getElementById('tower-hub-root')
    if (!root) return
    destroyTimers()
    resetData()
    bindUI()
    updateClock()
    clockTimer = setInterval(updateClock, 1000)
    setConflictUI(true)
    renderStrips()
    renderAircraft()
    renderRecommendations()
    motionTimer = setInterval(simulateMotion, 1200)
  }

  return { init, destroyTimers, reassignFlightSlot, focusFlight }
})()
