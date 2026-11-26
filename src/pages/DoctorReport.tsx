import { Card, ScreenHeader } from '../components/ui';

/** Placeholder until workflow 08b builds the report. */
export default function DoctorReport({ backHref }: { backHref?: string }) {
  return (
    <div className="space-y-4">
      <ScreenHeader title="Doctor report" backHref={backHref} />
      <Card>
        <p className="text-sm leading-relaxed">Coming next. This will make a summary of your entries to share with your prescriber.</p>
      </Card>
    </div>
  );
}
