import {
  SelectionEvent,
  SelectionIndividualRecord,
  ValueDate,
  ValueNameParts,
} from 'read-gedcom';
import {createEvents, EventAttributes, HeaderAttributes} from 'ics';
import {ValuePartDateDay} from 'read-gedcom/dist/cjs/parse/value/dates';

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
  const title = `Birthday of ${name}`;
  const description = (date: ValuePartDateDay) => `Born in ${date.year.value}`;
  return convertGedcomEventToIcs(individual.getEventBirth(), {
    title,
    description,
  });
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
  {
    title,
    description,
  }: {title: string; description?: (date: ValuePartDateDay) => string}
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
    description: description ? description(date) : undefined,
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
