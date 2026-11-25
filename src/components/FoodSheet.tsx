import { useRef, useState } from 'react';
import { deleteFoodLog, saveFood, saveFoodLog, type FoodLogEntry, type FoodValues, type Meal } from '../db/db';
import { loadFoods, portionsOf, portionValues, searchFoods, type UsdaFood } from '../lib/foodSearch';
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

  // A new pick fills the name; changing grams keeps whatever name is in the box.
  const fill = (v: FoodValues, newPick: boolean) => {
    if (newPick) setName(v.name);
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
        {!initial && <UsdaSearch onPick={fill} />}
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

/** Search box over the built-in USDA list; picking a food and a portion fills the form. Runs on the device. */
function UsdaSearch({ onPick }: { onPick: (v: FoodValues, newPick: boolean) => void }) {
  const [foods, setFoods] = useState<UsdaFood[]>();
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<UsdaFood>();
  const [portion, setPortion] = useState<[string, number]>();
  const [grams, setGrams] = useState('');
  const loading = useRef(false);

  const start = () => {
    if (foods || loading.current) return;
    loading.current = true;
    setFailed(false);
    loadFoods().then(setFoods, () => setFailed(true)).finally(() => (loading.current = false));
  };

  const choose = (f: UsdaFood, p: [string, number], newPick = false) => {
    setPortion(p);
    setGrams(String(p[1]));
    const v = portionValues(f, p[1], p[0]);
    if (v) onPick(v, newPick);
  };
  const pick = (f: UsdaFood) => {
    setPicked(f);
    choose(f, portionsOf(f)[0], true);
  };
  const typeGrams = (text: string) => {
    setGrams(text);
    setPortion(undefined);
    const g = parseNum(text);
    const v = picked && g !== undefined ? portionValues(picked, g) : null;
    if (v) onPick(v, false);
  };

  const results = foods && !picked ? searchFoods(foods, query) : [];
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
          start();
        }}
      />
      {failed && <p role="alert" className="mt-2 text-sm text-danger">The food list couldn’t load. You can still type the values below.</p>}
      {query.trim() && !picked && foods && (
        <ul className="mt-2 max-h-64 divide-y divide-line overflow-y-auto rounded-xl bg-surface" aria-label="Search results">
          {results.length === 0 && <li className="p-3 text-sm text-muted">No match. Try fewer words, or type the values below.</li>}
          {results.map((f, i) => (
            <li key={i}>
              <button type="button" onClick={() => pick(f)} className="flex min-h-11 w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm">
                <span>{f[0]}</span>
                <span className="flex-none text-xs text-muted">{Math.round(f[1])} kcal/100 g</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {picked && (
        <div className="mt-3">
          <p className="mb-1 text-sm font-medium" id="portion-label">Portion · {picked[0]}</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="portion-label">
            {portionsOf(picked).map((p) => (
              <button key={p[0]} type="button" aria-pressed={portion?.[0] === p[0]} onClick={() => choose(picked, p)} className={chip(portion?.[0] === p[0])}>
                {p[0]}{p[0] !== '100 g' && <span className="font-normal opacity-80"> · {p[1]} g</span>}
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input aria-label="Grams" className={`${inputClass} w-28!`} inputMode="decimal" value={grams} onChange={(e) => typeGrams(e.target.value)} />
            <span className="text-sm text-muted">grams</span>
          </div>
        </div>
      )}
      <p className="mt-2 text-xs text-muted">Food data: USDA FoodData Central (public domain). Searches stay on this phone.</p>
    </div>
  );
}
