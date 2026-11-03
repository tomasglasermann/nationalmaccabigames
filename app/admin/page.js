'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';

const TABS = [
  { id: 'registrations', label: 'Registration' },
  { id: 'donations', label: 'Donations' },
  { id: 'uniforms', label: 'Uniforms' },
  { id: 'communications', label: 'Communications' },
];

const REG_STATUSES = ['new', 'contacted', 'confirmed', 'declined'];
const UNI_STATUSES = ['needed', 'ordered', 'received'];

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

export default function AdminPage() {
  const [tab, setTab] = useState('registrations');
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [stats, setStats] = useState({ registrations: 0, donations: 0, donationTotal: 0, uniforms: 0 });
  const [regs, setRegs] = useState([]);
  const [dons, setDons] = useState([]);
  const [donTotal, setDonTotal] = useState(0);
  const [unis, setUnis] = useState([]);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [s, r, d, u] = await Promise.all([
      getJSON('/api/admin/stats'),
      getJSON('/api/admin/registrations'),
      getJSON('/api/admin/donations'),
      getJSON('/api/admin/uniforms'),
    ]);
    setConfigured(s.configured !== false);
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

  async function setRegStatus(id, status) {
    setRegs((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    await fetch('/api/admin/registrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
  }

  async function setUniStatus(id, status) {
    setUnis((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    await fetch('/api/admin/uniforms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
  }

  const filteredRegs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return regs;
    return regs.filter((r) =>
      [r.participant_first_name, r.participant_last_name, r.parent1_email, r.sport, r.parent1_first_name, r.parent1_last_name]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [regs, query]);

  function exportRegsCSV() {
    const cols = [
      ['participant_first_name', 'Participant First'],
      ['participant_last_name', 'Participant Last'],
      ['participant_phone', 'Participant Phone'],
      ['participant_dob', 'DOB'],
      ['parent1_first_name', 'Parent First'],
      ['parent1_last_name', 'Parent Last'],
      ['parent1_email', 'Parent Email'],
      ['parent1_phone', 'Parent Phone'],
      ['sport', 'Sport'],
      ['status', 'Status'],
      ['created_at', 'Submitted'],
    ];
    const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const lines = [cols.map((c) => esc(c[1])).join(',')];
    filteredRegs.forEach((r) => lines.push(cols.map((c) => esc(r[c[0]])).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nmb-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="admin">
      <header className="topbar">
        <div className="brand"><span className="dot" /> NMB Admin</div>
        <div className="who">
          <span className="hide-sm">tomasg@marjcc.org</span>
          <button className="logout" onClick={logout}>Sign out</button>
        </div>
      </header>

      <div className="container">
        {!configured ? (
          <div className="notice warn">
            <strong>Database not connected yet.</strong> Add your Supabase keys in Vercel
            (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) and run the schema. Until then the
            tabs will be empty.
          </div>
        ) : null}

        <div className="stats">
          <div className="tile"><div className="k">Registrations</div><div className="v">{stats.registrations ?? 0}</div></div>
          <div className="tile"><div className="k">Donations</div><div className="v">{stats.donations ?? 0}</div></div>
          <div className="tile"><div className="k">Raised</div><div className="v">{money(stats.donationTotal)}</div></div>
          <div className="tile"><div className="k">Uniform items</div><div className="v">{stats.uniforms ?? 0}</div></div>
        </div>

        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="panel"><div className="loading">Loading…</div></div>
        ) : tab === 'registrations' ? (
          <Registrations rows={filteredRegs} query={query} setQuery={setQuery} onStatus={setRegStatus} onExport={exportRegsCSV} />
        ) : tab === 'donations' ? (
          <Donations rows={dons} total={donTotal} />
        ) : tab === 'uniforms' ? (
          <Uniforms rows={unis} onStatus={setUniStatus} reload={load} />
        ) : (
          <Communications />
        )}
      </div>
    </div>
  );
}

function Registrations({ rows, query, setQuery, onStatus, onExport }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Interest form submissions</h2>
        <div className="tools">
          <input className="search" placeholder="Search name, email, sport…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="btn-sm btn-dark" onClick={onExport} disabled={!rows.length}>Export CSV</button>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="empty"><h3>No registrations yet</h3><p className="muted">Submissions from the website interest form will show up here.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Athlete</th><th>Sport</th><th>DOB</th><th>Parent/Guardian</th><th>Email</th><th>Phone</th><th>Submitted</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{[r.participant_first_name, r.participant_last_name].filter(Boolean).join(' ') || '—'}</td>
                  <td>{r.sport || '—'}</td>
                  <td>{r.participant_dob || '—'}</td>
                  <td>{[r.parent1_first_name, r.parent1_last_name].filter(Boolean).join(' ') || '—'}</td>
                  <td>{r.parent1_email || '—'}</td>
                  <td>{r.participant_phone || r.parent1_phone || '—'}</td>
                  <td>{fmtDate(r.created_at)}</td>
                  <td>
                    <select className="status-select" value={r.status || 'new'} onChange={(e) => onStatus(r.id, e.target.value)}>
                      {REG_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Donations({ rows, total }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Donations</h2>
        <div className="tools"><span className="muted">Total raised: <strong>{money(total)}</strong></span></div>
      </div>
      {rows.length === 0 ? (
        <div className="empty">
          <h3>No donations yet</h3>
          <p className="muted">Once the RedPodium webhook is connected, each donation appears here automatically.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Donor</th><th>Email</th><th>Amount</th><th>Source</th><th>Date</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.donor_name || '—'}</td>
                  <td>{r.donor_email || '—'}</td>
                  <td>{money(r.amount)}</td>
                  <td>{r.source || 'redpodium'}</td>
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

function Uniforms({ rows, onStatus, reload }) {
  const [form, setForm] = useState({ athlete_name: '', sport: '', item: '', size: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function add(e) {
    e.preventDefault();
    if (!form.athlete_name.trim()) return;
    setSaving(true);
    await fetch('/api/admin/uniforms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ athlete_name: '', sport: '', item: '', size: '' });
    setSaving(false);
    reload();
  }

  return (
    <div className="panel">
      <div className="panel-head"><h2>Uniforms</h2></div>
      <form className="comm-form" onSubmit={add} style={{ maxWidth: 'none', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', display: 'grid' }}>
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
                  <td>{r.athlete_name}</td>
                  <td>{r.sport || '—'}</td>
                  <td>{r.item || '—'}</td>
                  <td>{r.size || '—'}</td>
                  <td>
                    <select className="status-select" value={r.status || 'needed'} onChange={(e) => onStatus(r.id, e.target.value)}>
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

function Communications() {
  return (
    <div className="panel">
      <div className="panel-head"><h2>Communications</h2></div>
      <div className="notice info" style={{ margin: '16px 18px' }}>
        <strong>Coming next.</strong> Email sending (from tomasg@marjcc.org via Resend) is set up in the
        next phase. Once Resend is connected and the marjcc.org domain is verified, you'll compose
        here and send to your registrants.
      </div>
      <form className="comm-form" onSubmit={(e) => e.preventDefault()} aria-disabled="true" style={{ opacity: .55 }}>
        <input type="text" placeholder="Subject" disabled />
        <textarea placeholder="Write your message…" disabled />
        <button className="btn-sm btn-dark" type="submit" disabled>Send (not connected yet)</button>
      </form>
    </div>
  );
}
