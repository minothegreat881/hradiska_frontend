'use client';

import { useEffect, useState } from 'react';
import { Search, Ban, CheckCircle2, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { listUsers, blockUser, unblockUser, type AdminUser } from '../api/users';

export function UsersScreen() {
  const { token } = useAuth();
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blockTarget, setBlockTarget] = useState<AdminUser | null>(null);
  const [reason, setReason] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => { const t = setTimeout(() => setDq(q), 350); return () => clearTimeout(t); }, [q]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true); setError('');
    listUsers(token, dq)
      .then(u => { if (!cancelled) setRows(u); })
      .catch(e => { if (!cancelled) setError(e?.message || 'Načítanie zlyhalo.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, dq, reload]);

  const doBlock = async () => {
    if (!token || !blockTarget) return;
    try { await blockUser(token, blockTarget.id, reason); setBlockTarget(null); setReason(''); setReload(n => n + 1); }
    catch (e: any) { setError(e?.message || 'Blokovanie zlyhalo.'); setBlockTarget(null); }
  };

  const doUnblock = async (u: AdminUser) => {
    if (!token) return;
    setRows(rs => rs.map(x => x.id === u.id ? { ...x, blocked: false } : x));
    try { await unblockUser(token, u.id); setReload(n => n + 1); }
    catch { setRows(rs => rs.map(x => x.id === u.id ? { ...x, blocked: true } : x)); }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Používatelia</h1>
          <p style={{ fontSize: 13.5, color: 'var(--ad-secondary)', margin: '6px 0 0' }}>
            {rows.length} účtov · {rows.filter(u => u.blocked).length} zablokovaných
          </p>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', minWidth: 240 }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: 11, top: 11, color: 'var(--ad-muted)' }} />
          <input className="afld" value={q} onChange={e => setQ(e.target.value)} placeholder="Meno alebo e-mail…" style={{ paddingLeft: 34 }} />
        </div>
      </div>

      {error && (
        <div className="acard" style={{ padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, background: '#fbeae8', borderColor: '#e8c4bf' }}>
          <AlertCircle className="w-4 h-4" style={{ color: 'var(--ad-danger)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13.5, color: 'var(--ad-danger)' }}>{error}</div>
        </div>
      )}

      <div className="acard" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="atable" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>Meno</th>
                <th>E-mail</th>
                <th>Rola</th>
                <th>Stav</th>
                <th>Registrácia</th>
                <th style={{ width: 120 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--ad-secondary)' }}>
                  <Loader2 className="w-5 h-5 animate-spin" style={{ display: 'inline' }} /> Načítavam…
                </td></tr>
              )}
              {!loading && rows.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.displayName || u.username}</strong></td>
                  <td style={{ color: 'var(--ad-secondary)' }}>{u.email}</td>
                  <td>
                    <span className="achip achip-cat">{u.roleName || '—'}</span>
                  </td>
                  <td>
                    {u.blocked
                      ? <span className="achip achip-draft"><Ban className="w-3 h-3" /> Zablokovaný</span>
                      : !u.confirmed
                        ? <span className="achip achip-draft">Neoverený</span>
                        : <span className="achip achip-pub"><ShieldCheck className="w-3 h-3" /> Aktívny</span>}
                  </td>
                  <td style={{ color: 'var(--ad-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(u.createdAt).toLocaleDateString('sk-SK')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {u.roleName === 'Authenticated' ? (
                        <span style={{ fontSize: 12, color: 'var(--ad-muted)' }}>—</span>
                      ) : u.blocked ? (
                        <button className="abtn" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => doUnblock(u)}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Odblokovať
                        </button>
                      ) : (
                        <button className="abtn abtn-danger" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => { setBlockTarget(u); setReason(''); }}>
                          <Ban className="w-3.5 h-3.5" /> Zablokovať
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--ad-secondary)' }}>Žiadni používatelia.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {blockTarget && (
        <div onClick={() => setBlockTarget(null)}
             style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(30,22,12,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="acard" onClick={e => e.stopPropagation()} style={{ width: 'min(460px,92vw)', padding: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 10px' }}>Zablokovať účet?</h2>
            <p style={{ fontSize: 14, color: 'var(--ad-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>
              Účet <strong style={{ color: 'var(--ad-text)' }}>{blockTarget.displayName || blockTarget.username}</strong> sa
              nebude môcť prihlásiť. Jeho komentáre zostanú (dajú sa skryť zvlášť).
            </p>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: 'var(--ad-panel-head)', marginBottom: 5 }}>
              Dôvod (voliteľné)
            </label>
            <input className="afld" value={reason} onChange={e => setReason(e.target.value)}
                   placeholder="napr. opakovaný spam" style={{ marginBottom: 20 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="abtn" onClick={() => setBlockTarget(null)}>Zrušiť</button>
              <button className="abtn" onClick={doBlock} style={{ background: 'var(--ad-danger)', color: '#fff', borderColor: 'var(--ad-danger)' }}>
                Zablokovať
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
