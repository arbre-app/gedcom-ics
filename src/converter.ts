import {
  SelectionEvent,
  SelectionIndividualRecord,
  ValueDate,
  ValueNameParts,
} from 'read-gedcom';
import {createEvents, EventAttributes, HeaderAttributes} from 'ics';

export const getBirthdayIfAlive = (
  individual: SelectionIndividualRecord
): EventAttributes | null => {
  if (
    individual.getEventDeath().length > 0 ||
    individual.getEventBurial().length > 0 ||
    individual.getEventCremation().length > 0
  ) {
    return null;
  }
  const name = getIndividualName(individual);
  const label = `Birthday of ${name}`;
  return convertGedcomEventToIcs(individual.getEventBirth(), {title: label});
};

export const getIndividualName = (
  individual: SelectionIndividualRecord
): string =>
  individual
    .getName()
    .valueAsParts()
    .filter((v): v is ValueNameParts => !!v)
    .flat()
    .filter((v): v is string => !!v)
    .map(s => s.split(' ')[0])
    .join(' ');

export const convertGedcomEventToIcs = (
  event: SelectionEvent,
  {title}: {title: string}
): EventAttributes | null => {
  const value: ValueDate | undefined = event
    .getDate()
    .valueAsDate()
    .filter((v): v is ValueDate => !!v)[0];
  if (value === undefined) {
    return null;
  }
  if (!value.isDatePunctual) {
    return null;
  }
  const {date} = value;
  if (!date.calendar.isGregorian || date.year.isBce || date.year.isDual) {
    return null;
  }
  if (!('month' in date) || !('day' in date)) {
    return null;
  }
  return {
    title,
    start: [date.year.value, date.month, date.day],
    duration: {days: 1},
    recurrenceRule: 'FREQ=YEARLY;INTERVAL=1',
  };
};

export const createEventsSync = (
  events: EventAttributes[],
  headerAttributes: HeaderAttributes = {}
): string => {
  const {error, value} = createEvents(events, headerAttributes);
  if (error) {
    throw error;
  }
  return value ?? '';
};
