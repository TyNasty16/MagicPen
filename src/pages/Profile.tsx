import { useEffect, useState } from 'react';
import { Banner, Button, Card, Field, inputClass, ScreenHeader } from '../components/ui';
import { saveProfile, type Profile as ProfileRecord } from '../db/db';
import { WEEKDAYS } from '../lib/nextDose';
import { calculatedTargets, effectiveTargets } from '../lib/profileTargets';
import { PROTEIN_PER_KG_DEFAULT, type Activity, type Sex, type Targets } from '../lib/targets';
import { cmToFeetInches, flOzToMl, inToCm, kgToLb, lbToKg, mlToFlOz, parseNum, round1, type UnitSystem } from '../lib/units';

const ACTIVITIES: { value: Activity; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary — mostly sitting' },
  { value: 'light', label: 'Light — walks, light exercise 1–3 days/week' },
  { value: 'moderate', label: 'Moderate — exercise 3–5 days/week' },
  { value: 'active', label: 'Active — hard exercise 6–7 days/week' },
];
const TARGET_ROWS: { key: keyof Targets; label: string }[] = [
  { key: 'calories', label: 'Calories (kcal)' },
  { key: 'proteinG', label: 'Protein (g)' },
  { key: 'carbsG', label: 'Carbs (g)' },
  { key: 'fatG', label: 'Fat (g)' },
  { key: 'fiberG', label: 'Fiber (g)' },
  { key: 'waterMl', label: 'Water' },
];

type Draft = Omit<ProfileRecord, 'id' | 'disclaimerAcceptedAt'> & { overrides: Partial<Targets> };
type Texts = Record<string, string>;

const str = (n: number | undefined) => (n === undefined ? '' : String(n));

// Weight and water are typed in display units; these convert to/from the stored metric value.
const weightToText = (kg: number | undefined, u: UnitSystem) => str(kg === undefined ? undefined : round1(u === 'imperial' ? kgToLb(kg) : kg));
const weightFromText = (t: string, u: UnitSystem) => {
  const n = parseNum(t);
  return n === undefined ? undefined : u === 'imperial' ? lbToKg(n) : n;
};
const waterToText = (ml: number | undefined, u: UnitSystem) =>
  str(ml === undefined ? undefined : u === 'imperial' ? Math.round(mlToFlOz(ml)) : round1(ml / 1000));
const waterFromText = (t: string, u: UnitSystem) => {
  const n = parseNum(t);
  return n === undefined ? undefined : u === 'imperial' ? flOzToMl(n) : n * 1000;
};

function textsFor(d: Draft): Texts {
  const ftIn = d.heightCm === undefined ? undefined : cmToFeetInches(d.heightCm);
  const t: Texts = {
    heightFt: str(ftIn?.feet),
    heightIn: str(ftIn?.inches),
    heightCm: str(d.heightCm === undefined ? undefined : round1(d.heightCm)),
    start: weightToText(d.startWeightKg, d.units),
    goal: weightToText(d.goalWeightKg, d.units),
    birthYear: str(d.birthYear),
  };
  for (const { key } of TARGET_ROWS) {
    t[key] = key === 'waterMl' ? waterToText(d.overrides.waterMl, d.units) : str(d.overrides[key]);
  }
  return t;
}

const CORE_FIELDS = ['height', 'start', 'goal', 'birthYear', 'sex', 'activity'];

function validate(d: Draft): Record<string, string> {
  const e: Record<string, string> = {};
  const thisYear = new Date().getFullYear();
  if (d.heightCm === undefined || d.heightCm < 120 || d.heightCm > 230) e.height = 'Enter a height between 4\'0" and 7\'6" (120–230 cm).';
  if (d.startWeightKg === undefined || d.startWeightKg < 35 || d.startWeightKg > 350) e.start = 'Enter a weight between 77 and 770 lb (35–350 kg).';
  if (d.goalWeightKg === undefined || d.goalWeightKg < 35 || d.goalWeightKg > 350) e.goal = 'Enter a weight between 77 and 770 lb (35–350 kg).';
  if (d.birthYear === undefined || !Number.isInteger(d.birthYear) || thisYear - d.birthYear < 18 || thisYear - d.birthYear > 100) e.birthYear = 'Enter a birth year (age 18–100).';
  if (!d.sex) e.sex = 'Choose one.';
  if (!d.activity) e.activity = 'Choose one.';
  if (d.injectionWeekday === undefined) e.injectionWeekday = 'Choose a day.';
  for (const { key } of TARGET_ROWS) {
    const v = d.overrides[key];
    if (v !== undefined && (v <= 0 || v > 10000)) e[key] = 'Enter a positive number, or leave blank.';
  }
  return e;
}

export default function Profile({ profile, backHref, section }: { profile: ProfileRecord; backHref?: string; section?: string }) {
  useEffect(() => {
    if (section) document.getElementById(section)?.scrollIntoView();
  }, [section]);

  const [draft, setDraft] = useState<Draft>(() => {
    const { id: _id, disclaimerAcceptedAt: _d, ...rest } = profile;
    return { ...rest, overrides: profile.overrides ?? {} };
  });
  const [texts, setTexts] = useState<Texts>(() => textsFor(draft));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const update = (changes: Partial<Draft>, textChanges: Texts = {}) => {
    setDraft((d) => ({ ...d, ...changes }));
    setTexts((t) => ({ ...t, ...textChanges }));
    setSaved(false);
  };

  const setUnits = (units: UnitSystem) => {
    const next = { ...draft, units };
    setDraft(next);
    setTexts(textsFor(next)); // re-display the same stored metric values in the new units
    setSaved(false);
  };

  const setHeightImperial = (ft: string, inch: string) => {
    const f = parseNum(ft);
    const i = parseNum(inch);
    const heightCm = f === undefined && i === undefined ? undefined : inToCm((f ?? 0) * 12 + (i ?? 0));
    update({ heightCm }, { heightFt: ft, heightIn: inch });
  };

  const setOverride = (key: keyof Targets, text: string) => {
    const value = key === 'waterMl' ? waterFromText(text, draft.units) : parseNum(text);
    const overrides = { ...draft.overrides };
    if (value === undefined) delete overrides[key];
    else overrides[key] = value;
    update({ overrides }, { [key]: text });
  };

  const onSave = async () => {
    const e = validate(draft);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    await saveProfile(draft);
    setSaved(true);
  };

  // Only preview targets once the inputs they depend on are valid (avoids nonsense mid-typing).
  const coreValid = !CORE_FIELDS.some((f) => f in validate(draft));
  const calc = coreValid ? calculatedTargets(draft) : null;
  const effective = coreValid ? effectiveTargets(draft) : null;
  const imperial = draft.units === 'imperial';

  return (
    <div className="space-y-4">
      <ScreenHeader title="Profile" backHref={backHref} />

      <Card title="Units">
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Units">
          {(['imperial', 'metric'] as const).map((u) => (
            <button
              key={u}
              aria-pressed={draft.units === u}
              onClick={() => setUnits(u)}
              className={`min-h-11 rounded-xl border font-medium transition ${draft.units === u ? 'border-accent bg-accent text-on-accent' : 'border-line bg-bg'}`}
            >
              {u === 'imperial' ? 'lb / in' : 'kg / cm'}
            </button>
          ))}
        </div>
      </Card>

      <Card title="About you" id="about">
        <div className="space-y-4">
          <Field label="Height" htmlFor="height" error={errors.height}>
            {imperial ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <input id="height" aria-label="Feet" className={inputClass} inputMode="numeric" value={texts.heightFt} onChange={(e) => setHeightImperial(e.target.value, texts.heightIn)} />
                  <span className="text-muted">ft</span>
                </div>
                <div className="flex items-center gap-2">
                  <input aria-label="Inches" className={inputClass} inputMode="decimal" value={texts.heightIn} onChange={(e) => setHeightImperial(texts.heightFt, e.target.value)} />
                  <span className="text-muted">in</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input id="height" className={inputClass} inputMode="decimal" value={texts.heightCm} onChange={(e) => update({ heightCm: parseNum(e.target.value) }, { heightCm: e.target.value })} />
                <span className="text-muted">cm</span>
              </div>
            )}
          </Field>
          <Field label={`Starting weight (${imperial ? 'lb' : 'kg'})`} htmlFor="start" error={errors.start}>
            <input id="start" className={inputClass} inputMode="decimal" value={texts.start} onChange={(e) => update({ startWeightKg: weightFromText(e.target.value, draft.units) }, { start: e.target.value })} />
          </Field>
          <Field label={`Goal weight (${imperial ? 'lb' : 'kg'})`} htmlFor="goal" error={errors.goal}>
            <input id="goal" className={inputClass} inputMode="decimal" value={texts.goal} onChange={(e) => update({ goalWeightKg: weightFromText(e.target.value, draft.units) }, { goal: e.target.value })} />
          </Field>
          <Field label="Birth year" htmlFor="birthYear" error={errors.birthYear}>
            <input id="birthYear" className={inputClass} inputMode="numeric" value={texts.birthYear} onChange={(e) => update({ birthYear: parseNum(e.target.value) }, { birthYear: e.target.value })} />
          </Field>
          <Field label="Sex" hint="Used only for the calorie formula." htmlFor="sex" error={errors.sex}>
            <select id="sex" className={inputClass} value={draft.sex ?? ''} onChange={(e) => update({ sex: (e.target.value || undefined) as Sex | undefined })}>
              <option value="">Choose…</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </Field>
          <Field label="Activity level" htmlFor="activity" error={errors.activity}>
            <select id="activity" className={inputClass} value={draft.activity ?? ''} onChange={(e) => update({ activity: (e.target.value || undefined) as Activity | undefined })}>
              <option value="">Choose…</option>
              {ACTIVITIES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </Field>
          <Field label="Injection day" htmlFor="injectionWeekday" error={errors.injectionWeekday}>
            <select
              id="injectionWeekday"
              className={inputClass}
              value={draft.injectionWeekday ?? ''}
              onChange={(e) => update({ injectionWeekday: e.target.value === '' ? undefined : Number(e.target.value) })}
            >
              <option value="">Choose…</option>
              {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </select>
          </Field>
          <Field label="Protein goal" htmlFor="proteinPerKg" hint="Grams of protein per kg of goal weight (1.2–1.6).">
            <select id="proteinPerKg" className={inputClass} value={draft.proteinPerKg ?? PROTEIN_PER_KG_DEFAULT} onChange={(e) => update({ proteinPerKg: Number(e.target.value) })}>
              {[1.2, 1.3, 1.4, 1.5, 1.6].map((v) => <option key={v} value={v}>{v.toFixed(1)} g/kg</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card title="Daily targets" id="targets">
        {calc && effective ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Estimates. Leave a box blank to use the estimate, or type your own number.</p>
            {TARGET_ROWS.map(({ key, label }) => {
              const unitLabel = key === 'waterMl' ? (imperial ? 'Water (fl oz)' : 'Water (L)') : label;
              // Blank boxes show the estimate, re-balanced around any numbers the owner typed.
              const placeholder = key === 'waterMl' ? waterToText(effective.waterMl, draft.units) : String(effective[key]);
              const estimate = key === 'waterMl' ? waterToText(calc.waterMl, draft.units) : String(calc[key]);
              const overridden = draft.overrides[key] !== undefined;
              return (
                <Field key={key} label={unitLabel} htmlFor={`target-${key}`} error={errors[key]} hint={overridden ? `Estimate: ${estimate}` : undefined}>
                  <div className="flex items-center gap-2">
                    <input id={`target-${key}`} className={inputClass} inputMode="decimal" placeholder={placeholder} value={texts[key]} onChange={(e) => setOverride(key, e.target.value)} />
                    {overridden && <Button variant="quiet" onClick={() => setOverride(key, '')}>Reset</Button>}
                  </div>
                </Field>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">Fill in the fields above to see your estimated targets.</p>
        )}
      </Card>

      <Banner>These targets are estimates, not medical advice. Review them with your clinician.</Banner>

      {Object.keys(errors).length > 0 && <p className="text-sm text-danger">Please fix the highlighted fields.</p>}
      <Button className="w-full" onClick={onSave}>Save profile</Button>
      {saved && <p role="status" className="text-center text-sm text-muted">Saved.</p>}
    </div>
  );
}
