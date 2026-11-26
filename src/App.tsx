import { useLiveQuery } from 'dexie-react-hooks';
import { lazy, Suspense, useEffect, useState, type ComponentType, type SVGProps } from 'react';
import { HomeIcon, PulseIcon, ScaleIcon, SyringeIcon, UserIcon } from './components/icons';
import { getProfile, storageAvailable } from './db/db';
import Disclaimer from './pages/Disclaimer';
import Food from './pages/Food';
import Appointments from './pages/Appointments';
import DoctorReport from './pages/DoctorReport';
import Home from './pages/Home';
import Injections from './pages/Injections';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// The chart library is only needed on the Weight screen, so it loads separately.
const Weight = lazy(() => import('./pages/Weight'));
const Symptoms = lazy(() => import('./pages/Symptoms'));

// Tabs appear only once their milestone ships.
const TABS: { route: Route; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { route: 'home', label: 'Home', Icon: HomeIcon },
  { route: 'injections', label: 'Doses', Icon: SyringeIcon },
  { route: 'weight', label: 'Body', Icon: ScaleIcon },
  { route: 'symptoms', label: 'Symptoms', Icon: PulseIcon },
  { route: 'profile', label: 'Profile', Icon: UserIcon },
];
const ROUTES = ['home', 'injections', 'weight', 'symptoms', 'profile', 'settings', 'food', 'appointments', 'report'] as const;
type Route = (typeof ROUTES)[number];
interface Location { route: Route; params: URLSearchParams }

// Hash routing (#/profile?from=home&section=targets) works on any static host without server config.
function readLocation(): Location {
  const [path, query = ''] = window.location.hash.replace(/^#\/?/, '').split('?');
  const route = (ROUTES as readonly string[]).includes(path) ? (path as Route) : 'home';
  return { route, params: new URLSearchParams(query) };
}

function useLocation(): Location {
  const [loc, setLoc] = useState(readLocation);
  useEffect(() => {
    const onChange = () => {
      setLoc(readLocation());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return loc;
}

export default function App() {
  const profile = useLiveQuery(getProfile); // undefined while loading, null when none
  const { route, params } = useLocation();
  const [storageOk, setStorageOk] = useState(true);
  useEffect(() => {
    storageAvailable().then(setStorageOk);
  }, []);

  if (!storageOk) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <h1 className="mb-2 font-serif text-2xl font-semibold">Storage unavailable</h1>
        <p>Steady keeps your data on this device, but this browser is not allowing it (private browsing can cause this). Open Steady in a normal browser window or from your home screen.</p>
      </main>
    );
  }
  if (profile === undefined) return null;
  if (!profile?.disclaimerAcceptedAt) return <Disclaimer />;

  const backHref = params.get('from') === 'home' ? '#/home' : undefined;
  const startAdding = params.get('add') === '1';
  // Food opens from Home's nutrition tile, so Home stays highlighted there.
  const activeTab = route === 'settings' ? null : route === 'food' || route === 'appointments' || route === 'report' ? 'home' : route;

  return (
    <div className="mx-auto min-h-dvh max-w-md">
      <main className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-40">
        {route === 'home' && <Home profile={profile} />}
        {route === 'injections' && <Injections key={params.toString()} profile={profile} backHref={backHref} startAdding={startAdding} />}
        {route === 'weight' && (
          <Suspense fallback={null}>
            <Weight key={params.toString()} profile={profile} backHref={backHref} startAdding={startAdding} focusPhoto={params.get('photo') === '1'} view={params.get('view') === 'measurements' ? 'measurements' : undefined} />
          </Suspense>
        )}
        {route === 'symptoms' && (
          <Suspense fallback={null}>
            <Symptoms key={params.toString()} backHref={backHref} startAdding={startAdding} detail={params.get('detail') ?? undefined} />
          </Suspense>
        )}
        {route === 'profile' && <Profile key={params.toString()} profile={profile} backHref={backHref} section={params.get('section') ?? undefined} />}
        {route === 'settings' && <Settings />}
        {route === 'appointments' && <Appointments key={params.toString()} backHref={backHref} startAdding={startAdding} />}
        {route === 'report' && <DoctorReport backHref={backHref} />}
        {route === 'food' && <Food key={params.toString()} profile={profile} backHref={backHref} startAdding={startAdding} />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="mx-auto flex max-w-md">
          {TABS.map(({ route: r, label, Icon }) => (
            <li key={r} className="flex-1">
              <a
                href={`#/${r}`}
                aria-current={activeTab === r ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${activeTab === r ? 'font-semibold text-accent' : 'text-muted'}`}
              >
                <Icon />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
