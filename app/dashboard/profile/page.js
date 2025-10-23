'use client';

import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [me, setMe] = useState(null);
  const [pwd, setPwd] = useState({ old: '', n1: '', n2: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      setMe(data?.user || null);
    })();
  }, []);

  async function changePassword(e) {
    e.preventDefault();
    if (!pwd.n1 || pwd.n1 !== pwd.n2) return alert('New passwords do not match');
    setSaving(true);
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: pwd.old, newPassword: pwd.n1 })
    });
    setSaving(false);
    if (res.ok) { setPwd({ old: '', n1: '', n2: '' }); alert('Password changed'); }
    else alert((await res.json().catch(() => ({}))).message || 'Failed');
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">My Profile</h2>
          {!me ? <span className="loading loading-spinner" /> : (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="label">Username</div>
                <input className="input input-bordered w-full" value={me.username || ''} readOnly />
              </div>
              <div>
                <div className="label">Role</div>
                <input className="input input-bordered w-full" value={me.role || ''} readOnly />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">Change Password</h3>
          <form onSubmit={changePassword} className="grid gap-3 md:grid-cols-3">
            <input type="password" className="input input-bordered" placeholder="Current password"
              value={pwd.old} onChange={e => setPwd({ ...pwd, old: e.target.value })} required />
            <input type="password" className="input input-bordered" placeholder="New password"
              value={pwd.n1} onChange={e => setPwd({ ...pwd, n1: e.target.value })} required />
            <input type="password" className="input input-bordered" placeholder="Confirm new password"
              value={pwd.n2} onChange={e => setPwd({ ...pwd, n2: e.target.value })} required />
            <div className="md:col-span-3">
              <button className={`btn btn-primary ${saving ? 'btn-disabled' : ''}`}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
