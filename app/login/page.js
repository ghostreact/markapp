// // app/login/page.jsx
// 'use client';
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function LoginPage() {
//   const [identifier, setIdentifier] = useState('');
//   const [password, setPassword] = useState('');
//   const [msg, setMsg] = useState('');
//   const route = useRouter();

//   async function onSubmit(e) {
//     e.preventDefault();
//     setMsg('');
//     const res = await fetch('/api/auth/login', {
//       method: 'POST',
//       credentials: 'include', // สำคัญมาก เพื่อส่ง/รับคุกกี้
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ identifier, password }),
//     });
//     if (res.ok) {
//       setMsg('Login success');
//       // ไปหน้า dashboard
//       route.replace('/dashboard');
//     } else {
//       const data = await res.json().catch(() => ({}));
//       setMsg(data.message || 'Login failed');
//     }
//   }

//   return (
//     <form onSubmit={onSubmit} style={{ maxWidth: 320 }}>
//       <h1>Login</h1>
//       <input
//         placeholder="username or email"
//         value={identifier}
//         onChange={e => setIdentifier(e.target.value)}
//       />
//       <input
//         type="password"
//         placeholder="password"
//         value={password}
//         onChange={e => setPassword(e.target.value)}
//       />
//       <button>Sign in</button>
//       <p>{msg}</p>


//       <div className="flex items-center">
//         <span className="icon-[solar--user-bold] size-10"></span>
//         <span className="icon-[ic--sharp-account-circle] size-10"></span>
//         <span className="icon-[mdi--account-child] size-10"></span>
//         <span className="icon-[line-md--account] size-10"></span>
//         <span className="icon-[svg-spinners--3-dots-move] size-10"></span>
//       </div>


//     </form>
//   );
// }
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ให้แน่ใจว่าส่ง/รับคุกกี้ได้
        body: JSON.stringify({ identifier, password }),
      });

      if (res.ok) {
        router.replace('/dashboard');
      } else {
        const data = await res.json().catch(() => ({}));
        setErr(data.message || 'Login failed');
      }
    } catch (e) {
      setErr('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body">
          <h1 className="text-2xl font-semibold text-center">Login</h1>
          <p className="text-sm opacity-70 text-center">Sign in to your account</p>

          {err ? (
            <div className="alert alert-error mt-2">
              <span>{err}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Username or Email</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="yourname or you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="join w-full">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input input-bordered join-item w-full"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline join-item"
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              {/* <label className="label">
                <a href="/forgot" className="link link-hover text-sm">Forgot password?</a>
              </label> */}
            </div>

            <div className="form-control">
              <button
                className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`}
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* <div className="divider my-4">or</div>

          <p className="text-center text-sm">
            Don’t have an account?{' '}
            <a href="/register" className="link link-primary">Create one</a>
          </p> */}
        </div>
      </div>
    </div>
  );
}
