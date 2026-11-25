import { Card, ScreenHeader } from '../components/ui';
import { DISCLAIMER } from '../lib/disclaimer';

export default function Settings() {
  return (
    <div className="space-y-4">
      <ScreenHeader title="Settings" backHref="#/home" />
      <Card title="About Steady">
        <div className="space-y-2 text-sm leading-relaxed">
          {DISCLAIMER.map((p) => <p key={p}>{p}</p>)}
        </div>
      </Card>
      <p className="px-1 text-sm text-muted">All of your data is stored only on this device.</p>
    </div>
  );
}
