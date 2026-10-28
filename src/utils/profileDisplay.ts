import { unitLabel } from './units';
import type { Faculty } from '../types/faculty';

// Present directory metadata without implying a judgment about the faculty member.
export function affiliationLabel(person: Faculty) {
  if (person.primary_department !== 'Unknown') return unitLabel(person.primary_department);
  return person.additional_affiliations.length
    ? `${unitLabel(person.additional_affiliations[0])} affiliation`
    : 'COSSPP directory';
}

export function appointmentLabel(person: Faculty) {
  const categories: Record<Faculty['appointment_type'], string> = {
    regular: 'Regular faculty',
    teaching: 'Teaching faculty',
    visiting: 'Visiting faculty',
    adjunct: 'Adjunct faculty',
    emeritus: 'Emeritus faculty',
    affiliate: 'Affiliated listing',
    unknown: 'See the official FSU page for appointment details',
  };
  const status: Record<Faculty['current_affiliation_status'], string> = {
    current: 'Current listing',
    upcoming: 'Upcoming appointment',
    unknown: 'For current appointment details, consult the official FSU page',
  };
  return `${categories[person.appointment_type]} · ${status[person.current_affiliation_status]}`;
}
