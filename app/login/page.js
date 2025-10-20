// app/login/page.jsx
'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]   = useState('');
  const [msg, setMsg] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include', // สำคัญมาก เพื่อส่ง/รับคุกกี้
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (res.ok) {
      setMsg('Login success');
      // ไปหน้า dashboard
      window.location.href = '/dashboard';
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.message || 'Login failed');
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 320 }}>
      <h1>Login</h1>
      <input
        placeholder="username or email"
        value={identifier}
        onChange={e => setIdentifier(e.target.value)}
      />
      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button>Sign in</button>
      <p>{msg}</p>
    </form>
  );
}
