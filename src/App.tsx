import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { getProfile, storageAvailable } from './db/db';
import Disclaimer from './pages/Disclaimer';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Today from './pages/Today';

const TABS = [
  { route: 'today', label: 'Today' },
  { route: 'profile', label: 'Profile' },
  { route: 'settings', label: 'Settings' },
] as const;
type Route = (typeof TABS)[number]['route'];

// Hash routing works on any static host (GitHub Pages) without server config.
function useRoute(): Route {
  const read = (): Route => {
    const r = window.location.hash.replace(/^#\/?/, '');
    return TABS.some((t) => t.route === r) ? (r as Route) : 'today';
  };
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export default function App() {
  const profile = useLiveQuery(getProfile); // undefined while loading, null when none
  const route = useRoute();
  const [storageOk, setStorageOk] = useState(true);
  useEffect(() => {
    storageAvailable().then(setStorageOk);
  }, []);

  if (!storageOk) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-2 text-xl font-semibold">Storage unavailable</h1>
        <p>Steady keeps your data on this device, but this browser is not allowing it (private browsing can cause this). Open Steady in a normal browser window or from your home screen.</p>
      </main>
    );
  }
  if (profile === undefined) return null;
  if (!profile?.disclaimerAcceptedAt) return <Disclaimer />;

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      <main className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
        {route === 'today' && <Today profile={profile} />}
        {route === 'profile' && <Profile profile={profile} />}
        {route === 'settings' && <Settings />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto flex max-w-md">
          {TABS.map((t) => (
            <li key={t.route} className="flex-1">
              <a
                href={`#/${t.route}`}
                aria-current={route === t.route ? 'page' : undefined}
                className={`flex min-h-14 items-center justify-center text-sm font-medium ${route === t.route ? 'text-accent' : 'text-muted'}`}
              >
                {t.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
