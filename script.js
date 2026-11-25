/* THE FINAL INVITATION — client-only version */
'use strict';

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ------------------------------------------------------------------ */
/*  GAME DATA                                                          */
/* ------------------------------------------------------------------ */
const SUSPECTS = {
  vivienne: {
    name: 'Vivienne Marchetti',
    role: "The Victim's Business Partner",
    relation: 'Co-owner of the Marchetti Gallery for eleven years.',
    motive: 'The victim planned to dissolve their partnership and sell the gallery, leaving Vivienne with nothing.',
    alibi: 'Claims she was on the terrace making a phone call from 9:40 to 10:05 PM.',
    secret: 'Her phone records show the "call" lasted only ninety seconds. The rest of the time, she was unaccounted for.',
    portrait: 'VM',
    accent: '#7a1f2b',
  },
  julian: {
    name: 'Julian Ashford',
    role: "The Victim's Younger Brother",
    relation: 'Heir to the family estate — and deeply in debt.',
    motive: 'The victim had discovered Julian had forged her signature on a loan document worth £80,000.',
    alibi: 'Says he was in the library the entire evening, reading.',
    secret: 'A library camera captured him leaving at 9:47 PM and returning at 9:58 PM — the exact window of the murder.',
    portrait: 'JA',
    accent: '#3d5a6c',
  },
  imogen: {
    name: 'Imogen Blake',
    role: "The Victim's Personal Assistant",
    relation: 'Has worked for the victim for three years; knew every secret in the household.',
    motive: 'The victim had threatened to dismiss her after discovering she had been selling private photographs to a tabloid.',
    alibi: 'Insists she was in the kitchen preparing the birthday cake from 9:30 to 10:10 PM.',
    secret: 'The kitchen staff confirm she left at 9:42 PM and returned at 10:02 PM — and the cake was already prepared by the caterer.',
    portrait: 'IB',
    accent: '#5a3e2b',
  },
  theo: {
    name: 'Theodore "Theo" Vance',
    role: "The Victim's Former Lover",
    relation: 'A celebrated pianist who never forgave the victim for ending their engagement.',
    motive: 'The victim had recently become engaged to someone else — and had invited Theo to the party deliberately.',
    alibi: 'Says he was at the piano in the drawing room, playing for the guests.',
    secret: 'Three guests confirm he played continuously until 9:55 PM — but he stopped abruptly and was seen walking toward the east corridor.',
    portrait: 'TV',
    accent: '#4a4a4a',
  },
};

const EVIDENCE = {
  invitation: {
    title: 'The Handwritten Invitation',
    desc: 'A cream card in elegant cursive: "You are cordially invited to a private birthday gathering at the Ashford Estate. 9:00 PM. Come alone." The ink is burgundy — and the handwriting trembles slightly at the end.',
  },
  watch: {
    title: 'The Broken Wristwatch',
    desc: "A man's gold wristwatch found beneath the terrace railing. The crystal is shattered; the hands are frozen at 9:52 PM. Engraved on the back: \"To J.A. — always.\"",
   
  },
  photo: {
    title: 'The Suspicious Photograph',
    desc: 'A Polaroid tucked inside a book in the library. It shows the victim and Vivienne in heated argument on the terrace — the timestamp reads 9:48 PM, four minutes before the murder.',
   
  },
  letter: {
    title: 'The Torn Letter',
    desc: 'Half a letter recovered from the fireplace: "...cannot continue to protect you. The forgery is discovered. I will tell the family tomorrow—" The handwriting matches the victim\'s.',
  
  },
  glass: {
    title: 'The Fingerprinted Glass',
    desc: "A crystal tumbler on the terrace, half-full of red wine. Two distinct sets of fingerprints: one set belongs to the victim. The other matches Imogen Blake's employment records.",
   
  },
  receipt: {
    title: 'The Receipt',
    desc: 'A crumpled receipt from a London jeweller dated three days before the party: "Engagement ring — platinum, 1.2 carat. Paid in full." The customer name is smudged.',
   
  },
  note: {
    title: 'The Hidden Note',
    desc: 'A note folded into the lining of the victim\'s coat: "Terrace. 9:50. Come alone. We end this tonight." The handwriting is Vivienne\'s — confirmed by comparison with gallery documents.',
   
  },
  final: {
    title: 'The Final Piece of Evidence',
    desc: "A single burgundy thread caught on the terrace railing — matching the fabric of Vivienne's evening gown. Beside it, a faint smear of the victim's blood.",
   
  },
};

/* ------------------------------------------------------------------ */
/*  PUZZLE ANSWERS (kept in one place, lightly obfuscated)            */
/* ------------------------------------------------------------------ */
const ANSWERS = {
  timeline: ['receipt', 'invitation', 'letter', 'photo', 'note', 'watch', 'glass', 'final'],
  contradiction: { vivienne: 'photo', julian: 'watch', imogen: 'glass', theo: 'receipt' },
  motive: 'vivienne',
  culprit: 'vivienne',
};

/* ------------------------------------------------------------------ */
/*  STATE (localStorage persistence)                                   */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = 'fi_state_v1';

const DEFAULT_STATE = {
  evidence: [],
  suspects: [],
  puzzles: { timeline: false, contradiction: false, motive: false },
  solved: false,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch { return { ...DEFAULT_STATE }; }
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(FI)); } catch {}
}

function resetState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

const FI = loadState();

/* in-memory UI state */
let timelineOrder = [];
let contradictionMap = {};
let motiveChoice = null;

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */
function toast(msg, ms = 2600) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), ms);
}

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

/* ------------------------------------------------------------------ */
/*  RENDERERS                                                          */
/* ------------------------------------------------------------------ */
function renderSuspects() {
  const grid = $('#suspect-grid');
  grid.innerHTML = '';
  Object.entries(SUSPECTS).forEach(([id, s]) => {
    const card = document.createElement('article');
    card.className = 'suspect-card' + (FI.suspects.includes(id) ? ' interviewed' : '');
    card.dataset.id = id;
    card.innerHTML = `
      <div class="portrait" style="--accent:${s.accent}"><span>${s.portrait}</span></div>
      <h3>${s.name}</h3>
      <p class="suspect-role">${s.role}</p>
      <button class="btn btn-secondary btn-interview" data-id="${id}">Interview</button>
      <div class="suspect-details">
        <p><strong>Relation:</strong> ${s.relation}</p>
        <p><strong>Motive:</strong> ${s.motive}</p>
        <p><strong>Alibi:</strong> ${s.alibi}</p>
        <p><strong>Secret:</strong> ${s.secret}</p>
      </div>
    `;
    card.querySelector('.btn-interview').addEventListener('click', () => interviewSuspect(id));
    grid.appendChild(card);
  });
}

function interviewSuspect(id) {
  if (!FI.suspects.includes(id)) {
    FI.suspects.push(id);
    saveState();
  }
  const card = $(`.suspect-card[data-id="${id}"]`);
  if (card) card.classList.add('interviewed');
  refreshCounters();
  refreshPuzzleLocks();
  toast('Statement recorded.');
}

function renderEvidence() {
  const grid = $('#evidence-grid');
  grid.innerHTML = '';
  Object.entries(EVIDENCE).forEach(([id, e]) => {
    const card = document.createElement('article');
    card.className = 'evidence-card' + (FI.evidence.includes(id) ? ' collected' : '');
    card.dataset.id = id;
    card.innerHTML = `
      <div class="evidence-tag">EVIDENCE</div>
      <h3>${e.title}</h3>
      <p class="ev-desc">${e.desc}</p>
      <p class="ev-clue"><strong>Clue:</strong> ${e.clue}</p>
      <button class="btn btn-secondary btn-collect" data-id="${id}">Collect</button>
    `;
    card.querySelector('.btn-collect').addEventListener('click', () => collectEvidence(id));
    grid.appendChild(card);
  });
}

function collectEvidence(id) {
  if (!FI.evidence.includes(id)) {
    FI.evidence.push(id);
    saveState();
  }
  const card = $(`.evidence-card[data-id="${id}"]`);
  if (card) card.classList.add('collected');
  refreshCounters();
  refreshPuzzleLocks();
  toast('Evidence collected.');
}

function refreshCounters() {
  $('#ev-count').textContent = FI.evidence.length;
  $('#su-count').textContent = FI.suspects.length;
  const solved = Object.values(FI.puzzles).filter(Boolean).length;
  $('#pz-count').textContent = solved;
}

/* ------------------------------------------------------------------ */
/*  PUZZLES                                                            */
/* ------------------------------------------------------------------ */
function buildTimeline() {
  const slots = $('#timeline-slots');
  if (slots.dataset.built === '1') return;
  slots.dataset.built = '1';
  timelineOrder = [];
  for (let i = 0; i < 8; i++) {
    const div = document.createElement('div');
    div.className = 'timeline-slot';
    div.dataset.index = i;
    div.innerHTML = `<span class="num">${i + 1}</span><span class="label">— drop an item —</span>`;
    div.addEventListener('click', () => {
      const idx = Number(div.dataset.index);
      if (timelineOrder[idx]) {
        timelineOrder.splice(idx, 1);
        renderTimelineSlots();
        renderTimelinePool();
      }
    });
    slots.appendChild(div);
  }
  renderTimelinePool();
}

function renderTimelineSlots() {
  $$('#timeline-slots .timeline-slot').forEach((slot, i) => {
    const id = timelineOrder[i];
    const label = slot.querySelector('.label');
    if (id) {
      label.textContent = EVIDENCE[id].title;
      slot.classList.add('filled');
    } else {
      label.textContent = '— drop an item —';
      slot.classList.remove('filled');
    }
  });
}

function renderTimelinePool() {
  const pool = $('#timeline-pool');
  pool.innerHTML = '';
  Object.entries(EVIDENCE).forEach(([id, e]) => {
    if (timelineOrder.includes(id)) return;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'timeline-chip';
    chip.textContent = e.title;
    chip.addEventListener('click', () => {
      if (timelineOrder.length >= 8) return;
      timelineOrder.push(id);
      renderTimelineSlots();
      renderTimelinePool();
    });
    pool.appendChild(chip);
  });
  renderTimelineSlots();
}

function buildContradictions() {
  const grid = $('#contradiction-grid');
  if (grid.dataset.built === '1') return;
  grid.dataset.built = '1';
  grid.innerHTML = '';
  Object.entries(SUSPECTS).forEach(([id, s]) => {
    const row = document.createElement('div');
    row.className = 'contradiction-row';
    row.innerHTML = `
      <span><strong>${s.name}</strong></span>
      <select data-suspect="${id}">
        <option value="">— choose evidence —</option>
        ${Object.entries(EVIDENCE).map(([evId, ev]) =>
          `<option value="${evId}">${ev.title}</option>`).join('')}
      </select>
    `;
    const sel = row.querySelector('select');
    sel.addEventListener('change', () => { contradictionMap[id] = sel.value; });
    grid.appendChild(row);
  });
}

function buildMotive() {
  const grid = $('#motive-grid');
  if (grid.dataset.built === '1') return;
  grid.dataset.built = '1';
  grid.innerHTML = '';
  Object.entries(SUSPECTS).forEach(([id, s]) => {
    const opt = document.createElement('div');
    opt.className = 'motive-option';
    opt.dataset.id = id;
    opt.textContent = s.name;
    opt.addEventListener('click', () => {
      $$('#motive-grid .motive-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      motiveChoice = id;
    });
    grid.appendChild(opt);
  });
}

function refreshPuzzleLocks() {
  // Puzzles are always visible; readiness is enforced on submit.
  const allSolved = FI.puzzles.timeline && FI.puzzles.contradiction && FI.puzzles.motive;
  const locked = $('#accuse-locked');
  const form = $('#accuse-form');
  if (locked && form) {
    locked.classList.toggle('hidden', allSolved);
    form.classList.toggle('active', allSolved);
  }
  // mark solved puzzles
  $$('.puzzle-card').forEach(card => {
    const id = card.dataset.puzzle;
    if (FI.puzzles[id]) {
      const fb = $(`#fb-${id}`);
      if (fb && !fb.textContent) {
        fb.textContent = '✓ Completed.';
        fb.className = 'puzzle-feedback ok';
      }
    }
  });
}

function readyForPuzzles() {
  return FI.evidence.length >= 8 && FI.suspects.length >= 4;
}

function submitPuzzle(puzzle) {
  const fb = $(`#fb-${puzzle}`);
  fb.textContent = '';
  fb.className = 'puzzle-feedback';

  if (!readyForPuzzles()) {
    fb.textContent = 'Collect all eight pieces of evidence and interview every suspect first.';
    fb.classList.add('bad');
    return;
  }

  let correct = false;
  let feedback = '';

  if (puzzle === 'timeline') {
    if (timelineOrder.length !== 8) {
      fb.textContent = 'Place all eight pieces of evidence before submitting.';
      fb.classList.add('bad');
      return;
    }
    correct = arraysEqual(timelineOrder, ANSWERS.timeline);
    feedback = correct
      ? 'The timeline is reconstructed correctly. The receipt predates the party; the invitation, torn letter, photograph, hidden note, broken watch, fingerprinted glass, and final thread fall into place.'
      : 'The sequence does not hold. Reconsider which evidence predates the party and which items are timestamped.';
  } else if (puzzle === 'contradiction') {
    const keys = Object.keys(SUSPECTS);
    if (keys.some(k => !contradictionMap[k])) {
      fb.textContent = 'Pair every suspect with a piece of evidence before submitting.';
      fb.classList.add('bad');
      return;
    }
    correct = keys.every(k => contradictionMap[k] === ANSWERS.contradiction[k]);
    feedback = correct
      ? "Every contradiction is exposed. Vivienne was not on the phone; Julian was not in the library; Imogen was not in the kitchen; Theo's jealousy is confirmed by the receipt."
      : 'At least one pairing is wrong. Match each suspect to the single piece of evidence that most directly undercuts their alibi or confirms their motive.';
  } else if (puzzle === 'motive') {
    if (!motiveChoice) {
      fb.textContent = 'Select a suspect first.';
      fb.classList.add('bad');
      return;
    }
    correct = motiveChoice === ANSWERS.motive;
    feedback = correct
      ? 'Vivienne Marchetti had motive (the dissolving partnership) and opportunity (the hidden note placing her on the terrace at 9:50, the photograph at 9:48, and the burgundy thread at the scene).'
      : 'This suspect had motive — but not opportunity. Re-examine the timeline: who was on the terrace at 9:50 PM?';
  }

  fb.textContent = feedback;
  fb.classList.add(correct ? 'ok' : 'bad');

  if (correct) {
    FI.puzzles[puzzle] = true;
    saveState();
    refreshCounters();
    refreshPuzzleLocks();
    toast('Investigation advanced.');
  }
}

/* ------------------------------------------------------------------ */
/*  ACCUSATION                                                         */
/* ------------------------------------------------------------------ */
function populateAccuseSelect() {
  const sel = $('#accuse-suspect');
  sel.innerHTML = '<option value="">— Select —</option>' +
    Object.entries(SUSPECTS).map(([id, s]) =>
      `<option value="${id}">${s.name}</option>`).join('');
}

function submitAccusation(e) {
  e.preventDefault();
  const suspect = $('#accuse-suspect').value;
  const reasoning = $('#accuse-reasoning').value.trim();
  const fb = $('#accuse-feedback');
  fb.textContent = '';
  fb.className = 'accuse-feedback';

  const allSolved = FI.puzzles.timeline && FI.puzzles.contradiction && FI.puzzles.motive;
  if (!allSolved) {
    fb.textContent = 'You must complete all three investigations before making an accusation.';
    fb.classList.add('bad');
    return;
  }
  if (!suspect) {
    fb.textContent = 'Select a suspect.';
    fb.classList.add('bad');
    return;
  }
  if (reasoning.length < 20) {
    fb.textContent = 'Your reasoning must be at least 20 characters.';
    fb.classList.add('bad');
    return;
  }

  if (suspect === ANSWERS.culprit) {
    fb.textContent = 'The evidence holds. The culprit is Vivienne Marchetti.';
    fb.classList.add('ok');
    FI.solved = true;
    saveState();
    setTimeout(() => {
      showScreen('screen-ending');
      const cc = $('.case-closed-title');
      if (cc) { cc.style.animation = 'none'; void cc.offsetWidth; cc.style.animation = ''; }
    }, 1400);
  } else {
    const subtle = [
      'The evidence does not support this accusation. Return to the contradictions and look again.',
      'A plausible theory — but the physical evidence points elsewhere.',
      'Not quite. Ask yourself who had both the motive and the opportunity at 9:52 PM.',
    ];
    fb.textContent = subtle[Math.floor(Math.random() * subtle.length)];
    fb.classList.add('bad');
  }
}

/* ------------------------------------------------------------------ */
/*  HINTS                                                              */
/* ------------------------------------------------------------------ */
const HINTS = {
  timeline: 'The receipt is dated three days before the party — it must come first. The final piece of evidence is the physical trace at the scene.',
  contradiction: 'Match the most direct contradiction: the photograph against Vivienne, the watch against Julian, the glass against Imogen, the receipt against Theo.',
  motive: 'Look for the suspect who was confirmed at the terrace at 9:50 PM and had everything to lose.',
};

/* ------------------------------------------------------------------ */
/*  BOOT                                                               */
/* ------------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  // render
  renderSuspects();
  renderEvidence();
  buildTimeline();
  buildContradictions();
  buildMotive();
  populateAccuseSelect();
  refreshCounters();
  refreshPuzzleLocks();

  if (FI.solved) showScreen('screen-ending');

  // begin
  $('#btn-begin').addEventListener('click', () => showScreen('screen-game'));

  // tabs
  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $$('.panel').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById(`panel-${tab.dataset.tab}`);
      if (panel) panel.classList.add('active');
    });
  });

  // puzzle submit
  $$('.btn-submit-puzzle').forEach(btn => {
    btn.addEventListener('click', () => submitPuzzle(btn.dataset.puzzle));
  });

  // hints
  $$('.btn-hint').forEach(btn => {
    btn.addEventListener('click', () => toast(HINTS[btn.dataset.puzzle] || 'No hint available.'));
  });

  // accusation
  $('#accuse-form').addEventListener('submit', submitAccusation);

  // reset
  const reset = () => {
    if (!confirm('Reset all progress? This cannot be undone.')) return;
    resetState();
    location.reload();
  };
  $('#btn-reset').addEventListener('click', reset);
  $('#btn-reset-ending').addEventListener('click', reset);
});