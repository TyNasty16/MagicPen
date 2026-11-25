import { useEffect, useRef, useState } from 'react';
import { deleteFoodLog, saveFood, saveFoodLog, type FoodLogEntry, type FoodValues, type Meal } from '../db/db';
import { fromUsda, loadFoods, pickValues, searchFoods, statesAmount, type Pickable, type PickedValues, type UsdaFood } from '../lib/foodSearch';
import { searchOnline } from '../lib/offClient';
import { hiddenLine, OFF_CREDIT, OFF_MESSAGES, OFF_NOTICE, OFF_WARNING, offSavedName, type OffProduct } from '../lib/offSearch';
import { MEALS, validateFood, whole } from '../lib/nutrition';
import { parseNum } from '../lib/units';
import BottomSheet from './BottomSheet';
import { Button, Field, inputClass } from './ui';

type NumKey = 'kcal' | 'proteinG' | 'carbsG' | 'fatG' | 'fiberG';
// Protein first (owner decision, workflow 05).
const NUM_FIELDS: { key: NumKey; label: string }[] = [
  { key: 'proteinG', label: 'Protein g' },
  { key: 'kcal', label: 'Calories' },
  { key: 'carbsG', label: 'Carbs g' },
  { key: 'fatG', label: 'Fat g' },
];
const QUICK_SERVINGS: [string, string][] = [['½', '0.5'], ['1', '1'], ['1½', '1.5']];
const chip = (on: boolean) => `min-h-11 rounded-full border px-4 text-sm font-semibold transition ${on ? 'border-accent bg-accent text-on-accent' : 'border-line bg-bg text-muted'}`;
const num = (n?: number) => (n === undefined ? '' : String(Math.round(n * 10) / 10));

/** Log a food (with optional USDA search) or edit one log entry. */
export default function FoodSheet({ day, initial, onDone }: { day: string; initial?: FoodLogEntry; onDone: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [servingDesc, setServingDesc] = useState(initial?.servingDesc);
  const [nums, setNums] = useState<Record<NumKey, string>>({
    kcal: num(initial?.kcal), proteinG: num(initial?.proteinG), carbsG: num(initial?.carbsG), fatG: num(initial?.fatG), fiberG: num(initial?.fiberG),
  });
  const [servings, setServings] = useState(initial ? String(initial.servings) : '1');
  const [meal, setMeal] = useState<Meal>(initial?.meal ?? 'none');
  const [favourite, setFavourite] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // A new pick fills the name; changing grams keeps whatever name is in the box. Online picks pre-tick My Foods.
  const fill = (v: PickedValues, newPick: boolean, online: boolean) => {
    if (newPick) setName(v.name);
    if (newPick) setFavourite(online); // online picks pre-tick My Foods; a later built-in pick clears it
    setServingDesc(v.servingDesc);
    setNums({ kcal: String(Math.round(v.kcal)), proteinG: num(v.proteinG), carbsG: num(v.carbsG), fatG: num(v.fatG), fiberG: num(v.fiberG) });
    setErrors({});
  };

  const values = (): FoodValues & { servings?: number } => ({
    name: name.trim(),
    servingDesc,
    kcal: parseNum(nums.kcal) as number,
    proteinG: parseNum(nums.proteinG) as number,
    carbsG: parseNum(nums.carbsG) as number,
    fatG: parseNum(nums.fatG) as number,
    fiberG: nums.fiberG.trim() ? (parseNum(nums.fiberG) ?? NaN) : undefined,
    servings: parseNum(servings),
  });

  const save = async () => {
    const v = values();
    const e = validateFood(v);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const { servings: s, ...food } = v;
    await saveFoodLog({ ...food, ...(initial?.id ? { id: initial.id } : {}), date: initial?.date ?? day, meal, servings: s!, createdAt: initial?.createdAt ?? new Date().toISOString() });
    if (favourite) await saveFood(food);
    onDone();
  };

  const remove = async () => {
    if (initial?.id && window.confirm('Delete this entry?')) {
      await deleteFoodLog(initial.id);
      onDone();
    }
  };

  const s = parseNum(servings) ?? 0;
  const p = parseNum(nums.proteinG);
  const k = parseNum(nums.kcal);
  const preview = p !== undefined && k !== undefined && s > 0 ? ` · ${whole(p * s)} g protein · ${whole(k * s)} kcal` : '';

  return (
    <BottomSheet
      title={initial ? 'Edit food' : 'Log food'}
      onClose={onDone}
      footer={<Button className="w-full" onClick={save}>Save{preview}</Button>}
    >
      <div className="space-y-4">
        {!initial && <FoodSearch onPick={fill} />}
        <Field label="Name" htmlFor="fname" error={errors.name} hint={servingDesc ? `Per serving: ${servingDesc}` : undefined}>
          <input id="fname" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </Field>
        <div className="grid grid-cols-4 gap-2">
          {NUM_FIELDS.map((f) => (
            <div key={f.key}>
              <label htmlFor={`f-${f.key}`} className="mb-1 block text-[13px] font-medium whitespace-nowrap">{f.label}</label>
              <input id={`f-${f.key}`} className={`${inputClass} px-2 ${errors[f.key] ? 'border-danger' : ''}`} inputMode="decimal" value={nums[f.key]} aria-invalid={!!errors[f.key]} onChange={(e) => { setNums({ ...nums, [f.key]: e.target.value }); setServingDesc(undefined); }} />
            </div>
          ))}
        </div>
        {NUM_FIELDS.some((f) => errors[f.key]) && <p role="alert" className="-mt-2 text-sm text-danger">Enter a number (0 or more) in each box.</p>}
        <Field label="Fiber g (optional)" htmlFor="f-fiberG" error={errors.fiberG}>
          <input id="f-fiberG" className={inputClass} inputMode="decimal" value={nums.fiberG} onChange={(e) => { setNums({ ...nums, fiberG: e.target.value }); setServingDesc(undefined); }} />
        </Field>
        <div>
          <p className="mb-1 text-sm font-medium" id="servings-label">Servings</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="servings-label">
            {QUICK_SERVINGS.map(([label, v]) => (
              <button key={v} type="button" aria-pressed={servings === v} onClick={() => setServings(v)} className={`${chip(servings === v)} min-w-11 px-3`}>{label}</button>
            ))}
            <input aria-label="Servings" className={`${inputClass} w-24! flex-none`} inputMode="decimal" value={servings} onChange={(e) => setServings(e.target.value)} />
          </div>
          {errors.servings && <p role="alert" className="mt-1 text-sm text-danger">Servings: {errors.servings}</p>}
        </div>
        <div>
          <p className="mb-1 text-sm font-medium" id="meal-label">Meal</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="meal-label">
            {MEALS.map((m) => (
              <button key={m.id} type="button" aria-pressed={meal === m.id} onClick={() => setMeal(m.id)} className={chip(meal === m.id)}>{m.label}</button>
            ))}
          </div>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" className="size-5 accent-accent" checked={favourite} onChange={(e) => setFavourite(e.target.checked)} />
          Save to My Foods
        </label>
        {initial && <button type="button" onClick={remove} className="min-h-11 w-full text-sm font-medium text-danger">Delete entry</button>}
      </div>
    </BottomSheet>
  );
}

const OFF_ACK_KEY = 'steady.offNoticeAck';
const OFF_COOLDOWN_MS = 3000;
const readAck = () => {
  try {
    return localStorage.getItem(OFF_ACK_KEY) === '1';
  } catch {
    return false; // storage blocked: the notice shows each time
  }
};

type Online = { state: 'idle' } | { state: 'notice' } | { state: 'loading' } | { state: 'done'; shown: OffProduct[]; hidden: number } | { state: 'error'; message: string };

/**
 * Search box: the built-in USDA list (on the phone) first; "Search online" sends the words to Open Food Facts only when tapped.
 * Picking a food and a portion fills the form.
 */
function FoodSearch({ onPick }: { onPick: (v: PickedValues, newPick: boolean, online: boolean) => void }) {
  const [foods, setFoods] = useState<UsdaFood[]>();
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<{ food: Pickable; online: boolean }>();
  const [portion, setPortion] = useState<string>();
  const [amount, setAmount] = useState('');
  const [online, setOnline] = useState<Online>({ state: 'idle' });
  const [usedOnline, setUsedOnline] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);
  const loading = useRef(false);
  const request = useRef(0); // ignores a late reply once the words changed or a newer search started
  const cooldownTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onlineButton = useRef<HTMLButtonElement>(null);
  useEffect(() => () => {
    request.current++;
    clearTimeout(cooldownTimer.current);
  }, []);

  const start = () => {
    if (foods || loading.current) return;
    loading.current = true;
    setFailed(false);
    loadFoods().then(setFoods, () => setFailed(true)).finally(() => (loading.current = false));
  };

  const choose = (p: Pickable, isOnline: boolean, [label, amt]: [string, number], newPick = false) => {
    setPortion(label);
    setAmount(String(amt));
    const v = pickValues(p, amt, label);
    if (v) onPick(v, newPick, isOnline);
  };
  const pick = (p: Pickable, isOnline: boolean) => {
    setPicked({ food: p, online: isOnline });
    choose(p, isOnline, p.portions[0], true);
  };
  const typeAmount = (text: string) => {
    setAmount(text);
    setPortion(undefined);
    const a = parseNum(text);
    const v = picked && a !== undefined ? pickValues(picked.food, a) : null;
    if (v) onPick(v, false, picked!.online);
  };

  const runOnline = async () => {
    setOnline({ state: 'loading' });
    setUsedOnline(true);
    setCoolingDown(true);
    clearTimeout(cooldownTimer.current);
    cooldownTimer.current = setTimeout(() => setCoolingDown(false), OFF_COOLDOWN_MS);
    const id = ++request.current;
    const r = await searchOnline(query);
    if (id !== request.current) return;
    setOnline(r.ok ? { state: 'done', shown: r.shown, hidden: r.hidden } : { state: 'error', message: OFF_MESSAGES[r.error] });
  };
  const askOnline = () => {
    if (coolingDown || online.state === 'loading' || !query.trim()) return;
    if (readAck()) void runOnline();
    else setOnline({ state: 'notice' });
  };
  const acceptNotice = () => {
    try {
      localStorage.setItem(OFF_ACK_KEY, '1');
    } catch {
      /* storage blocked: ask again next time */
    }
    void runOnline();
  };

  const results = foods && !picked ? searchFoods(foods, query) : [];
  const unit = picked?.food.unit ?? 'g';
  return (
    <div className="rounded-2xl border border-line bg-bg/60 p-3">
      <label htmlFor="fsearch" className="mb-1 block text-sm font-medium">Search foods</label>
      <input
        id="fsearch"
        type="search"
        className={inputClass}
        placeholder="e.g. chocolate chip muffin"
        value={query}
        autoComplete="off"
        onFocus={start}
        onChange={(e) => {
          setQuery(e.target.value);
          setPicked(undefined);
          setOnline({ state: 'idle' });
          request.current++;
          start();
        }}
      />
      {failed && <p role="alert" className="mt-2 text-sm text-danger">The food list couldn’t load. You can still type the values below.</p>}
      {query.trim() && !picked && foods && (
        <ul className="mt-2 max-h-64 divide-y divide-line overflow-y-auto rounded-xl bg-surface" aria-label="Built-in results">
          {results.length === 0 && <li className="p-3 text-sm text-muted">No match. Try fewer words, or type the values below.</li>}
          {results.map((f, i) => (
            <li key={i}>
              <button type="button" onClick={() => pick(fromUsda(f), false)} className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm">
                <span>{f[0]}</span>
                <span className="flex-none text-xs text-muted">{Math.round(f[1])} kcal/100 g</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.trim() && !picked && (
        <div className="mt-2">
          {online.state === 'notice' ? (
            <div role="group" aria-label="Search online?" className="rounded-xl border border-line bg-surface p-3 text-sm">
              <p>{OFF_NOTICE}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setOnline({ state: 'idle' }); setTimeout(() => onlineButton.current?.focus()); }} className="min-h-11 rounded-2xl border border-line font-semibold text-accent">Cancel</button>
                <button type="button" autoFocus onClick={acceptNotice} className="min-h-11 rounded-2xl bg-accent font-semibold text-on-accent">Search</button>
              </div>
            </div>
          ) : (
            <button ref={onlineButton} type="button" onClick={askOnline} disabled={coolingDown || online.state === 'loading'} className="min-h-11 w-full rounded-2xl border border-line bg-surface px-3 text-sm font-semibold text-accent disabled:opacity-60">
              {online.state === 'loading' ? 'Searching…' : coolingDown ? 'Wait…' : `Search online for “${query.trim()}”`}
            </button>
          )}
          <div aria-live="polite">
            {online.state === 'error' && <p className="mt-2 text-sm text-danger">{online.message}</p>}
            {online.state === 'done' && (
              <>
                <ul className="mt-2 max-h-72 divide-y divide-line overflow-y-auto rounded-xl bg-surface" aria-label="Online results">
                  {online.shown.length === 0 && <li className="p-3 text-sm text-muted">{OFF_MESSAGES.empty}</li>}
                  {online.shown.map((p, i) => (
                    <li key={i}>
                      <button type="button" onClick={() => pick({ ...p, name: offSavedName(p) }, true)} className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm">
                        <span className="min-w-0">
                          {p.name}
                          {p.brand && <span className="block text-xs text-muted">{p.brand}</span>}
                        </span>
                        <span className="flex-none text-xs text-muted">{Math.round(p.per100.kcal)} kcal/100 {p.unit}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {hiddenLine(online.hidden) && <p className="mt-1 text-xs text-muted">{hiddenLine(online.hidden)}</p>}
                <p className="mt-1 text-xs text-muted">{OFF_CREDIT}</p>
              </>
            )}
          </div>
        </div>
      )}

      {picked && (
        <div className="mt-3">
          {picked.online && <p className="mb-2 rounded-xl bg-warn/10 px-3 py-2 text-sm font-medium">{OFF_WARNING}</p>}
          <p className="mb-1 text-sm font-medium" id="portion-label">Portion · {picked.food.name}</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="portion-label">
            {picked.food.portions.map((p) => (
              <button key={p[0]} type="button" aria-pressed={portion === p[0]} onClick={() => choose(picked.food, picked.online, p)} className={chip(portion === p[0])}>
                {p[0]}
                {p[0] !== `100 ${unit}` && !statesAmount(p[0], p[1], unit) && <span className="font-normal opacity-80"> · {p[1]} {unit}</span>}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input aria-label={unit === 'ml' ? 'Millilitres' : 'Grams'} className={`${inputClass} w-28!`} inputMode="decimal" value={amount} onChange={(e) => typeAmount(e.target.value)} />
            <span className="text-sm text-muted">{unit === 'ml' ? 'ml' : 'grams'}</span>
          </div>
          {picked.online && <p className="mt-2 text-xs text-muted">{OFF_CREDIT}</p>}
        </div>
      )}
      <p className="mt-2 text-xs text-muted">Food data: USDA FoodData Central (public domain). {usedOnline ? 'Built-in list searches stay on this phone.' : 'Searches stay on this phone.'}</p>
    </div>
  );
}
