'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';

const TABS = [
  { id: 'registrations', label: 'Registration' },
  { id: 'donations', label: 'Donations' },
  { id: 'uniforms', label: 'Uniforms' },
  { id: 'communications', label: 'Communications' },
];

const TAB_ICONS = {
  registrations: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>),
  donations: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>),
  uniforms: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3l5 3-2.5 4.5L17 9.5V21H7V9.5l-1.5 1L3 6l5-3a4 4 0 0 0 8 0z"/></svg>),
  communications: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>),
};

const REG_STATUSES = ['new', 'contacted', 'confirmed', 'declined'];
const UNI_STATUSES = ['needed', 'ordered', 'received'];
const SPORTS = [
  'Soccer Boys U15', 'Soccer Girls U15', 'Soccer Boys U17',
  'Basketball Boys U15', 'Basketball Girls U15', 'Basketball Boys U17', 'Basketball Girls U17',
  'Tennis U15', 'Tennis U17', 'Swimming U15', 'Swimming U17', 'Football U17',
];

function fmtDate(v) {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function money(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
async function getJSON(url) {
  const r = await fetch(url, { cache: 'no-store' });
  return r.json().catch(() => ({}));
}
const fullName = (a, b) => [a, b].filter(Boolean).join(' ') || '—';

export default function AdminPage() {
  const [tab, setTab] = useState('registrations');
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [dbError, setDbError] = useState('');
  const [stats, setStats] = useState({ registrations: 0, donations: 0, donationTotal: 0, uniforms: 0 });
  const [regs, setRegs] = useState([]);
  const [dons, setDons] = useState([]);
  const [donTotal, setDonTotal] = useState(0);
  const [unis, setUnis] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, r, d, u] = await Promise.all([
      getJSON('/api/admin/stats'),
      getJSON('/api/admin/registrations'),
      getJSON('/api/admin/donations'),
      getJSON('/api/admin/uniforms'),
    ]);
    setConfigured(s.configured !== false);
    setDbError(r.error || s.error || d.error || u.error || '');
    setStats(s || {});
    setRegs(r.rows || []);
    setDons(d.rows || []);
    setDonTotal(d.total || 0);
    setUnis(u.rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  return (
    <div className="admin">
      <aside className="sidebar">
        <div className="sidebar__brand"><span className="dot" /><b>NMB Admin</b></div>
        <nav className="snav">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              {TAB_ICONS[t.id]}<span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar__foot">
          <div className="sidebar__user" title="tomasg@marjcc.org">tomasg@marjcc.org</div>
          <button className="logout" onClick={logout}>Sign out</button>
        </div>
      </aside>

      <main className="main">
        <h1 className="main__title">{(TABS.find((t) => t.id === tab) || {}).label || 'Dashboard'}</h1>

        {!configured ? (
          <div className="notice warn">
            <strong>Database not connected yet.</strong> Add your Supabase keys in Vercel
            (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) and run the schema.
          </div>
        ) : null}
        {configured && dbError ? (
          <div className="notice warn">
            <strong>Database error:</strong> {dbError}. Check the schema and that
            SUPABASE_SERVICE_ROLE_KEY is the service_role key.
          </div>
        ) : null}

        <div className="stats">
          <div className="tile"><div className="k">Registrations</div><div className="v">{regs.length}</div></div>
          <div className="tile"><div className="k">Donations</div><div className="v">{dons.length}</div></div>
          <div className="tile"><div className="k">Raised</div><div className="v">{money(donTotal)}</div></div>
          <div className="tile"><div className="k">Uniform items</div><div className="v">{unis.length}</div></div>
        </div>

        {loading ? (
          <div className="panel"><div className="loading">Loading…</div></div>
        ) : tab === 'registrations' ? (
          <Registrations rows={regs} setRows={setRegs} />
        ) : tab === 'donations' ? (
          <Donations rows={dons} total={donTotal} />
        ) : tab === 'uniforms' ? (
          <Uniforms rows={unis} setRows={setUnis} reload={load} />
        ) : (
          <Communications regs={regs} />
        )}
      </main>
    </div>
  );
}

/* ---------------- Registrations ---------------- */
function Registrations({ rows, setRows }) {
  const [query, setQuery] = useState('');
  const [sport, setSport] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(null);

  const sportsInData = useMemo(
    () => Array.from(new Set(rows.map((r) => r.sport).filter(Boolean))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (sport && r.sport !== sport) return false;
      if (status && (r.status || 'new') !== status) return false;
      if (!q) return true;
      return [r.participant_first_name, r.participant_last_name, r.parent1_email, r.sport, r.parent1_first_name, r.parent1_last_name]
        .filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [rows, query, sport, status]);

  async function setStatusFor(id, value) {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, status: value } : x)));
    setOpen((o) => (o && o.id === id ? { ...o, status: value } : o));
    await fetch('/api/admin/registrations', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: value }),
    });
  }
  async function saveNotes(id, notes) {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, notes } : x)));
    await fetch('/api/admin/registrations', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notes }),
    });
  }
  // Save edited fields. Returns true on success, false on error.
  async function saveRow(id, patch) {
    const res = await fetch('/api/admin/registrations', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return false;
    const next = data.row || { ...patch, id };
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, ...next } : x)));
    setOpen((o) => (o && o.id === id ? { ...o, ...next } : o));
    return true;
  }
  // Delete a registration (optimistic; reverts on error).
  async function removeRow(id) {
    const prevRows = rows;
    setRows((prev) => prev.filter((x) => x.id !== id));
    setOpen((o) => (o && o.id === id ? null : o));
    const res = await fetch('/api/admin/registrations', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { setRows(prevRows); alert('Could not delete. Please try again.'); }
  }

  function exportCSV() {
    const cols = [
      ['participant_first_name', 'Participant First'], ['participant_last_name', 'Participant Last'],
      ['participant_phone', 'Participant Phone'], ['participant_dob', 'DOB'],
      ['parent1_first_name', 'Parent First'], ['parent1_last_name', 'Parent Last'],
      ['parent1_email', 'Parent Email'], ['parent1_phone', 'Parent Phone'],
      ['sport', 'Sport'], ['status', 'Status'], ['created_at', 'Submitted'],
    ];
    const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const lines = [cols.map((c) => esc(c[1])).join(',')];
    filtered.forEach((r) => lines.push(cols.map((c) => esc(r[c[0]])).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nmb-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Interest form submissions</h2>
        <div className="tools">
          <input className="search" placeholder="Search name, email, sport…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="status-select" value={sport} onChange={(e) => setSport(e.target.value)}>
            <option value="">All sports</option>
            {sportsInData.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="status-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {REG_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn-sm btn-dark" onClick={exportCSV} disabled={!filtered.length}>Export CSV</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="empty"><h3>{rows.length ? 'No matches' : 'No registrations yet'}</h3>
          <p className="muted">{rows.length ? 'Try clearing the filters.' : 'Submissions from the website interest form will show up here.'}</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Athlete</th><th>Sport</th><th>Parent/Guardian</th><th>Email</th><th>Submitted</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{fullName(r.participant_first_name, r.participant_last_name)}</td>
                  <td>{r.sport || '—'}</td>
                  <td>{fullName(r.parent1_first_name, r.parent1_last_name)}</td>
                  <td>{r.parent1_email || '—'}</td>
                  <td>{fmtDate(r.created_at)}</td>
                  <td>
                    <select className="status-select" value={r.status || 'new'} onChange={(e) => setStatusFor(r.id, e.target.value)}>
                      {REG_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="row-actions">
                    <button className="btn-sm" onClick={() => setOpen(r)}>View</button>
                    <button className="btn-sm btn-danger" onClick={() => {
                      if (window.confirm(`Delete the registration for ${fullName(r.participant_first_name, r.participant_last_name)}? This can't be undone.`)) removeRow(r.id);
                    }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open ? <RegDetail row={open} onClose={() => setOpen(null)} onSaveRow={saveRow} onDelete={removeRow} /> : null}
    </div>
  );
}

const REG_FIELDS = [
  ['participant_first_name', 'Participant first name'],
  ['participant_last_name', 'Participant last name'],
  ['participant_dob', 'Date of birth'],
  ['participant_phone', 'Participant phone'],
  ['parent1_first_name', 'Parent / guardian first name'],
  ['parent1_last_name', 'Parent / guardian last name'],
  ['parent1_email', 'Parent email'],
  ['parent1_phone', 'Parent phone'],
];

function RegDetail({ row, onClose, onSaveRow, onDelete }) {
  const blank = () => {
    const f = { status: row.status || 'new', notes: row.notes || '', sport: row.sport || '' };
    REG_FIELDS.forEach(([k]) => { f[k] = row[k] || ''; });
    return f;
  };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setSaved(false); };

  const dirty = useMemo(() => {
    if ((form.status || 'new') !== (row.status || 'new')) return true;
    if ((form.notes || '') !== (row.notes || '')) return true;
    if ((form.sport || '') !== (row.sport || '')) return true;
    return REG_FIELDS.some(([k]) => (form[k] || '') !== (row[k] || ''));
  }, [form, row]);

  async function save() {
    setSaving(true);
    const ok = await onSaveRow(row.id, { ...form });
    setSaving(false);
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 1800); }
    else alert('Could not save. Please try again.');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Edit registration</h3>
          <button className="modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <div className="kv">
            <span className="kv-k">Sport</span>
            <span className="kv-v">
              <select className="status-select" value={form.sport} onChange={set('sport')}>
                <option value="">—</option>
                {(SPORTS.includes(form.sport) || !form.sport ? SPORTS : [form.sport, ...SPORTS]).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </span>
          </div>
          {REG_FIELDS.map(([k, label]) => (
            <div className="kv" key={k}>
              <span className="kv-k">{label}</span>
              <span className="kv-v"><input className="edit-input" type="text" value={form[k]} onChange={set(k)} /></span>
            </div>
          ))}
          <div className="kv">
            <span className="kv-k">Status</span>
            <span className="kv-v">
              <select className="status-select" value={form.status} onChange={set('status')}>
                {REG_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </span>
          </div>
          <div className="kv"><span className="kv-k">Submitted</span><span className="kv-v">{fmtDate(row.created_at)}</span></div>
          <div className="kv kv-notes">
            <span className="kv-k">Notes</span>
            <textarea value={form.notes} onChange={set('notes')} placeholder="Internal notes…" />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-sm btn-danger" onClick={() => {
            if (window.confirm(`Delete the registration for ${fullName(row.participant_first_name, row.participant_last_name)}? This can't be undone.`)) onDelete(row.id);
          }}>Delete</button>
          <span className="modal-foot__spacer" />
          <button className="btn-sm" onClick={onClose}>Close</button>
          <button className="btn-sm btn-dark" onClick={save} disabled={saving || !dirty}>
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Donations ---------------- */
function Donations({ rows, total }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Donations</h2>
        <div className="tools"><span className="muted">Total raised: <strong>{money(total)}</strong></span></div>
      </div>
      {rows.length === 0 ? (
        <div className="empty"><h3>No donations yet</h3>
          <p className="muted">Once the RedPodium webhook is connected, each donation appears here automatically.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Donor</th><th>Email</th><th>Amount</th><th>Source</th><th>Date</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.donor_name || '—'}</td><td>{r.donor_email || '—'}</td>
                  <td>{money(r.amount)}</td><td>{r.source || 'redpodium'}</td><td>{fmtDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Uniforms ---------------- */
function Uniforms({ rows, setRows, reload }) {
  const [form, setForm] = useState({ athlete_name: '', sport: '', item: '', size: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function setStatusFor(id, status) {
    setRows((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    await fetch('/api/admin/uniforms', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
  }
  async function add(e) {
    e.preventDefault();
    if (!form.athlete_name.trim()) return;
    setSaving(true);
    await fetch('/api/admin/uniforms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    setForm({ athlete_name: '', sport: '', item: '', size: '' });
    setSaving(false);
    reload();
  }

  return (
    <div className="panel">
      <div className="panel-head"><h2>Uniforms</h2></div>
      <form className="uni-form" onSubmit={add}>
        <input type="text" placeholder="Athlete name *" value={form.athlete_name} onChange={set('athlete_name')} />
        <input type="text" placeholder="Sport" value={form.sport} onChange={set('sport')} />
        <input type="text" placeholder="Item (jersey, warm-up…)" value={form.item} onChange={set('item')} />
        <input type="text" placeholder="Size" value={form.size} onChange={set('size')} />
        <button className="btn-sm btn-dark" type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add item'}</button>
      </form>
      {rows.length === 0 ? (
        <div className="empty"><h3>No uniform items yet</h3><p className="muted">Add athletes and track sizes and order status here.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Athlete</th><th>Sport</th><th>Item</th><th>Size</th><th>Status</th><th>Added</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.athlete_name}</td><td>{r.sport || '—'}</td><td>{r.item || '—'}</td><td>{r.size || '—'}</td>
                  <td>
                    <select className="status-select" value={r.status || 'needed'} onChange={(e) => setStatusFor(r.id, e.target.value)}>
                      {UNI_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>{fmtDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Communications ---------------- */
function Communications({ regs }) {
  const [audience, setAudience] = useState('all');
  const [sport, setSport] = useState(SPORTS[0]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [resendReady, setResendReady] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getJSON('/api/admin/communications').then((d) => {
      setResendReady(d.resendReady !== false);
      setHistory(d.rows || []);
    });
  }, []);

  const recipientCount = useMemo(() => {
    const set = new Set();
    regs.forEach((r) => {
      if (audience === 'sport' && r.sport !== sport) return;
      const e = (r.parent1_email || '').trim().toLowerCase();
      if (e) set.add(e);
    });
    return set.size;
  }, [regs, audience, sport]);

  async function send(test) {
    setResult(null);
    if (!subject.trim() || !body.trim()) { setResult({ error: 'Add a subject and a message first.' }); return; }
    setSending(true);
    const res = await fetch('/api/admin/communications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body, audience, sport, test }),
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) { setResult({ error: data.error || 'Could not send' }); return; }
    setResult({ ok: true, sent: data.sent, failed: data.failed, test });
    if (!test) { setSubject(''); setBody(''); getJSON('/api/admin/communications').then((d) => setHistory(d.rows || [])); }
  }

  return (
    <div className="panel">
      <div className="panel-head"><h2>Communications</h2></div>

      {!resendReady ? (
        <div className="notice warn" style={{ margin: '16px 18px' }}>
          <strong>Email not connected yet.</strong> Add <code>RESEND_API_KEY</code> and <code>MAIL_FROM</code> in Vercel
          and verify the marjcc.org domain in Resend. You can still write a draft below; sending activates once connected.
        </div>
      ) : null}

      <div className="comm-form">
        <div className="comm-row">
          <label>
            <span className="kv-k">Audience</span>
            <select className="status-select" value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="all">All registrants</option>
              <option value="sport">By sport</option>
            </select>
          </label>
          {audience === 'sport' ? (
            <label>
              <span className="kv-k">Sport</span>
              <select className="status-select" value={sport} onChange={(e) => setSport(e.target.value)}>
                {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          ) : null}
          <span className="muted" style={{ alignSelf: 'end' }}>{recipientCount} recipient{recipientCount === 1 ? '' : 's'}</span>
        </div>

        <input type="text" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea placeholder="Write your message… (plain text or HTML)" value={body} onChange={(e) => setBody(e.target.value)} />

        {result ? (
          <div className={`notice ${result.error ? 'warn' : 'info'}`}>
            {result.error
              ? result.error
              : result.test
                ? `Test sent to you (${result.sent} email).`
                : `Sent to ${result.sent} recipient${result.sent === 1 ? '' : 's'}${result.failed ? `, ${result.failed} failed` : ''}.`}
          </div>
        ) : null}

        <div className="comm-actions">
          <button className="btn-sm" onClick={() => send(true)} disabled={sending}>Send test to me</button>
          <button className="btn-sm btn-dark" onClick={() => send(false)} disabled={sending || recipientCount === 0}>
            {sending ? 'Sending…' : `Send to ${recipientCount}`}
          </button>
        </div>
      </div>

      {history.length ? (
        <div className="table-wrap" style={{ borderTop: '1px solid var(--line)' }}>
          <table>
            <thead><tr><th>Sent</th><th>Subject</th><th>Recipients</th><th>Status</th></tr></thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td>{fmtDate(h.created_at)}</td>
                  <td className="wrap">{h.subject}</td>
                  <td>{h.sent_count}</td>
                  <td><span className={`badge ${h.status === 'sent' ? 'received' : 'needed'}`}>{h.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
