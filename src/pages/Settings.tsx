import { Card } from '../components/ui';
import { DISCLAIMER } from '../lib/disclaimer';

export default function Settings() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <Card title="About Steady">
        <div className="space-y-2 text-sm leading-relaxed">
          {DISCLAIMER.map((p) => <p key={p}>{p}</p>)}
        </div>
      </Card>
      <p className="text-sm text-muted">All of your data is stored only on this device.</p>
    </div>
  );
}
