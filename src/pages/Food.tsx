import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { useNow } from '../lib/useNow';
import BottomSheet from '../components/BottomSheet';
import FoodSheet from '../components/FoodSheet';
import NutritionRings from '../components/NutritionRings';
import { BackIcon, ChevronIcon } from '../components/icons';
import { Button, Card, ScreenHeader } from '../components/ui';
import {
  addWater, deleteFood, deleteWater, listDayMarksSince, listFoodLogSince, listFoods, listWaterSince, listWeights, saveFoodLog, setLowIntake,
  type Food as FoodRecord, type FoodLogEntry, type Profile,
} from '../db/db';
import { dayKey, fromDayKey, shortDate } from '../lib/dates';
import { dayTotals, entryTotals, MEAL_GROUPS, proteinLowDays, proteinNote, shiftDay, whole } from '../lib/nutrition';
import { effectiveTargets } from '../lib/profileTargets';
import { clearAddParam } from '../lib/route';
import { waterAmount, waterQuickAdds, waterUnit } from '../lib/water';
import { latestWeightKg } from '../lib/weight';

type Sheet = { kind: 'log' } | { kind: 'edit'; entry: FoodLogEntry } | { kind: 'favourites' };

export default function Food({ profile, backHref, startAdding }: { profile: Profile; backHref?: string; startAdding?: boolean }) {
  const now = useNow(); // refreshes when the app returns to the foreground, e.g. the next morning
  const today = dayKey(now);
  const [day, setDay] = useState(today);
  // If the date rolled over while "today" was shown, follow it to the new day.
  const [shownToday, setShownToday] = useState(today);
  if (shownToday !== today) {
    setShownToday(today);
    if (day === shownToday) setDay(today);
  }
  const [sheet, setSheet] = useState<Sheet | undefined>(startAdding ? { kind: 'log' } : undefined);
  useEffect(() => {
    if (startAdding) clearAddParam();
  }, [startAdding]);

  // Load from whichever is earlier: the shown day or the start of the 7-day protein window.
  const since = [day, shiftDay(today, -7)].sort()[0];
  const entries = useLiveQuery(() => listFoodLogSince(since), [since]);
  const water = useLiveQuery(() => listWaterSince(since), [since]);
  const marks = useLiveQuery(() => listDayMarksSince(since), [since]);
  const weights = useLiveQuery(listWeights);
  if (!entries || !water || !marks || !weights) return null;

  const targets = effectiveTargets(profile, latestWeightKg(weights));
  const dayEntries = entries.filter((e) => e.date === day);
  const totals = dayTotals(dayEntries);
  const dayWater = water.filter((w) => w.date === day);
  const waterMl = dayWater.reduce((s, w) => s + w.ml, 0);
  const marked = marks.some((m) => m.date === day);
  const pl = targets ? proteinLowDays(entries, marks.map((m) => m.date), targets.proteinG, now) : undefined;
  const note = pl ? proteinNote(pl.low, pl.logged) : null;
  const u = profile.units;

  return (
    <div className="space-y-3.5">
      <ScreenHeader title="Food" backHref={backHref} />

      <div className="-mt-1 flex items-center justify-between">
        <button type="button" aria-label="Previous day" onClick={() => setDay(shiftDay(day, -1))} className="grid size-11 place-items-center rounded-2xl bg-surface text-accent shadow-soft">
          <BackIcon />
        </button>
        <p className="font-semibold" aria-live="polite">{day === today ? 'Today · ' : ''}{shortDate(fromDayKey(day))}</p>
        <button type="button" aria-label="Next day" disabled={day >= today} onClick={() => setDay(shiftDay(day, 1))} className="grid size-11 place-items-center rounded-2xl bg-surface text-accent shadow-soft disabled:opacity-35">
          <ChevronIcon />
        </button>
      </div>

      <Card>
        {marked && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-11 items-center gap-1 rounded-full bg-track pl-4 text-sm font-semibold text-accent">
              Marked: barely ate
              <button type="button" onClick={() => setLowIntake(day, false)} className="min-h-11 rounded-full px-3 font-semibold underline-offset-2 hover:underline">Undo</button>
            </span>
          </div>
        )}
        {targets ? (
          <NutritionRings totals={totals} targets={targets} />
        ) : (
          <p className="text-sm text-muted">
            {whole(totals.proteinG)} g protein · {whole(totals.kcal)} kcal · {whole(totals.carbsG)} g carbs · {whole(totals.fatG)} g fat.{' '}
            <a href="#/profile" className="font-medium text-accent">Set up your profile</a> to see targets.
          </p>
        )}
        <p className="mt-3 border-t border-line pt-2.5 text-sm text-muted">
          Fiber {whole(totals.fiberG)}{targets ? ` / ${targets.fiberG}` : ''} g{note ? ` · ${note}` : ''}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => setSheet({ kind: 'log' })}>Log food</Button>
        <Button variant="quiet" className="border border-line bg-surface no-underline!" onClick={() => setSheet({ kind: 'favourites' })}>My Foods</Button>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.07em] text-muted">Water</p>
            <p><b className="font-serif text-xl">{waterAmount(waterMl, u)}</b> <span className="text-sm text-muted">{targets ? `/ ${waterAmount(targets.waterMl, u)} ` : ''}{waterUnit(u)}</span></p>
          </div>
          <div className="flex gap-1.5">
            {waterQuickAdds(u).map((q) => (
              <button key={q.label} type="button" aria-label={`Add ${q.label.slice(2)} water`} onClick={() => addWater(day, q.ml)} className="min-h-11 rounded-2xl border border-line bg-surface px-3 text-sm font-semibold text-accent">{q.label.replace(' fl oz', '').replace(' ml', '')}</button>
            ))}
          </div>
        </div>
        {dayWater.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Water logged">
            {dayWater.map((w) => (
              <li key={w.id}>
                <button type="button" aria-label={`Remove ${waterAmount(w.ml, u)} ${waterUnit(u)}`} onClick={() => deleteWater(w.id!)} className="min-h-11 rounded-full bg-track px-3 text-xs text-muted">
                  {u === 'imperial' ? `${waterAmount(w.ml, u)} fl oz` : `${Math.round(w.ml)} ml`} ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        {dayEntries.length === 0 ? (
          <p className="text-sm text-muted">{day === today ? 'Nothing logged yet today.' : 'Nothing logged on this day.'}</p>
        ) : (
          <div className="space-y-3">
            {MEAL_GROUPS.map((g) => {
              const list = dayEntries.filter((e) => e.meal === g.id);
              if (list.length === 0) return null;
              return (
                <section key={g.id} aria-label={g.label}>
                  <h2 className="mb-0.5 text-xs font-semibold uppercase tracking-[0.07em] text-muted">{g.label}</h2>
                  <ul className="divide-y divide-line">
                    {list.map((e) => {
                      const t = entryTotals(e);
                      return (
                        <li key={e.id}>
                          <button type="button" onClick={() => setSheet({ kind: 'edit', entry: e })} className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left text-sm">
                            <span className="min-w-0">{e.name} <span className="text-muted">· {servingsLabel(e.servings)}</span></span>
                            <span className="flex-none text-muted">{whole(t.proteinG)} g P · {whole(t.kcal)} kcal</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </Card>

      {!marked && (
        <button type="button" onClick={() => setLowIntake(day, true)} className="min-h-11 w-full rounded-2xl border border-line bg-surface font-semibold text-accent">
          Barely ate {day === today ? 'today' : 'this day'}
        </button>
      )}

      {sheet?.kind === 'log' && <FoodSheet day={day} onDone={() => setSheet(undefined)} />}
      {sheet?.kind === 'edit' && <FoodSheet day={day} initial={sheet.entry} onDone={() => setSheet(undefined)} />}
      {sheet?.kind === 'favourites' && <MyFoods day={day} onDone={() => setSheet(undefined)} />}
    </div>
  );
}

const servingsLabel = (s: number) => (s === 0.5 ? '½' : s === 1.5 ? '1½' : String(s));

/** Favourites: one tap logs one serving to the shown day. */
function MyFoods({ day, onDone }: { day: string; onDone: () => void }) {
  const foods = useLiveQuery(listFoods);
  const [added, setAdded] = useState<string>();
  const log = async (f: FoodRecord) => {
    await saveFoodLog({ name: f.name, servingDesc: f.servingDesc, kcal: f.kcal, proteinG: f.proteinG, carbsG: f.carbsG, fatG: f.fatG, fiberG: f.fiberG, date: day, meal: 'none', servings: 1, createdAt: new Date().toISOString() });
    setAdded(f.name);
  };
  const remove = async (f: FoodRecord) => {
    if (window.confirm(`Remove “${f.name}” from My Foods? Past entries stay in your log.`)) await deleteFood(f.id!);
  };
  return (
    <BottomSheet title="My Foods" onClose={onDone} footer={<Button className="w-full" onClick={onDone}>Done</Button>}>
      <p role="status" className="mb-2 min-h-5 text-sm text-muted">{added ? `Added ${added} (1 serving). Tap it in the list to change meal or servings.` : 'Tap a food to log 1 serving.'}</p>
      {foods && foods.length === 0 && <p className="text-sm text-muted">No saved foods yet. When logging a food, tick “Save to My Foods”.</p>}
      <ul className="divide-y divide-line">
        {foods?.map((f) => (
          <li key={f.id} className="flex items-center gap-2">
            <button type="button" onClick={() => log(f)} className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-2 py-2 text-left text-sm">
              <span className="min-w-0">{f.name}{f.servingDesc && <span className="block text-xs text-muted">{f.servingDesc}</span>}</span>
              <span className="flex-none text-muted">{whole(f.proteinG)} g P · {whole(f.kcal)} kcal</span>
            </button>
            <button type="button" aria-label={`Remove ${f.name} from My Foods`} onClick={() => remove(f)} className="grid size-11 flex-none place-items-center text-muted">✕</button>
          </li>
        ))}
      </ul>
    </BottomSheet>
  );
}
