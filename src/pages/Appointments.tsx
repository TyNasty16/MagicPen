import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import BottomSheet from '../components/BottomSheet';
import { PlusIcon } from '../components/icons';
import { Button, Field, inputClass, ScreenHeader } from '../components/ui';
import { deleteAppointment, listAppointments, saveAppointment, type Appointment } from '../db/db';
import { cleanText, sortAppointments, TEXT_MAX, WHO_MAX } from '../lib/appointments';
import { dayKey, fromDayKey, shortDate } from '../lib/dates';
import { clearAddParam } from '../lib/route';

/** Logged visits with the owner's notes and questions (workflow 08a). */
export default function Appointments({ backHref, startAdding }: { backHref?: string; startAdding?: boolean }) {
  const list = useLiveQuery(listAppointments);
  const [editing, setEditing] = useState<Appointment | 'new' | undefined>(startAdding ? 'new' : undefined);
  useEffect(() => {
    if (startAdding) clearAddParam();
  }, [startAdding]);
  if (!list) return null;
  const sorted = sortAppointments(list);

  return (
    <div className="space-y-4">
      <ScreenHeader title="Appointments" backHref={backHref} />
      <Button className="flex w-full items-center justify-center gap-2" onClick={() => setEditing('new')}>
        <PlusIcon width={20} height={20} /> Add appointment
      </Button>
      {sorted.length === 0 ? (
        <p className="px-1 text-sm text-muted">No appointments yet. Add a visit to keep notes and questions for next time.</p>
      ) : (
        <ul className="space-y-2.5">
          {sorted.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => setEditing(a)} className="w-full rounded-2xl bg-surface px-4 py-3 text-left shadow-soft">
                <span className="block font-semibold">{shortDate(fromDayKey(a.date))}{a.who ? ` · ${a.who}` : ''}</span>
                {a.questions && <span className="mt-1 inline-block rounded-full bg-track px-2.5 py-0.5 text-xs font-semibold text-accent">Questions open</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing && <AppointmentSheet key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} onDone={() => setEditing(undefined)} />}
    </div>
  );
}

function AppointmentSheet({ initial, onDone }: { initial?: Appointment; onDone: () => void }) {
  const [date, setDate] = useState(initial?.date ?? dayKey(new Date()));
  const [who, setWho] = useState(initial?.who ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [questions, setQuestions] = useState(initial?.questions ?? '');
  const [error, setError] = useState<string>();

  const save = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Choose a date.');
    await saveAppointment({
      ...(initial?.id ? { id: initial.id } : {}),
      date,
      who: cleanText(who, WHO_MAX, false),
      notes: cleanText(notes),
      questions: cleanText(questions),
    });
    onDone();
  };
  const remove = async () => {
    if (initial?.id && window.confirm('Delete this appointment? This can’t be undone.')) {
      await deleteAppointment(initial.id);
      onDone();
    }
  };

  return (
    <BottomSheet
      title={initial ? 'Edit appointment' : 'Add appointment'}
      onClose={onDone}
      footer={
        <>
          {error && <p role="alert" className="mb-2 text-sm text-danger">{error}</p>}
          <Button className="w-full" onClick={save}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Date" htmlFor="appt-date">
          <input id="appt-date" type="date" className={inputClass} value={date} onChange={(e) => { setDate(e.target.value); setError(undefined); }} />
        </Field>
        <Field label="Who or what (optional)" htmlFor="appt-who">
          <input id="appt-who" className={inputClass} maxLength={WHO_MAX} value={who} onChange={(e) => setWho(e.target.value)} />
        </Field>
        <Field label="Notes (optional)" htmlFor="appt-notes">
          <textarea id="appt-notes" rows={4} maxLength={TEXT_MAX} className={`${inputClass} py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        <Field label="Questions for next time (optional)" htmlFor="appt-questions">
          <textarea id="appt-questions" rows={3} maxLength={TEXT_MAX} className={`${inputClass} py-2`} value={questions} onChange={(e) => setQuestions(e.target.value)} />
        </Field>
        {initial && <button type="button" onClick={remove} className="min-h-11 w-full text-sm font-medium text-danger">Delete appointment</button>}
      </div>
    </BottomSheet>
  );
}
