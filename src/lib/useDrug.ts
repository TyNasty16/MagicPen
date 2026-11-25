import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile } from '../db/db';
import { drugOf, type DrugId } from './drugs';

/** The profile's medicine (Wegovy until the owner chooses otherwise). */
export function useDrug(): DrugId {
  return drugOf(useLiveQuery(getProfile));
}
