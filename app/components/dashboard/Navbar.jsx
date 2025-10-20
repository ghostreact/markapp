'use client';

export default function Navbar({ user, onLogout }) {
    return (
        <div className="navbar bg-base-100 shadow-sm sticky top-0 z-40">
            <div className="flex-1">
                <a className="btn btn-ghost text-xl">My School</a>
            </div>
            <div className="flex-none gap-2">
                <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost">
                        <div className="avatar placeholder">
                            <div className="bg-neutral text-neutral-content rounded-full w-8">
                                <span className="text-xs">{(user?.role || 'U')[0]}</span>
                            </div>
                        </div>
                        <span className="hidden sm:inline ml-2 capitalize">{user?.role}</span>
                    </div>
                    <ul tabIndex={0} className="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                        <li><a href="/profile">Profile</a></li>
                        <li><button onClick={onLogout} className="text-error">Logout</button></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
