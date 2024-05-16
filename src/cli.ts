import {parse} from 'ts-command-line-args';
import * as fs from 'node:fs';
import {validateSourceGedcomFile, validateTargetIcsFile} from './cliUtils';
import {readGedcom} from 'read-gedcom';
import {fail} from './log';
import {
  createEventsSync,
  getBirthdayIfAlive,
  getIndividualName,
} from './converter';
import {exploreAscendingDescending} from './graph';
import {EventAttributes} from 'ics';

interface CliArguments {
  sourceGedcomFile: string;
  targetIcsFile: string;
  individualId: string;
  generations: number;
  help?: boolean;
}

const {sourceGedcomFile, targetIcsFile, individualId, generations} =
  parse<CliArguments>(
    {
      sourceGedcomFile: {
        type: String,
        alias: 'i',
        description: 'The source Gedcom file (.ged)',
      },
      targetIcsFile: {
        type: String,
        alias: 'o',
        description: 'The target ICS file (.ics)',
      },
      individualId: {
        type: String,
        alias: 'p',
        description: 'The root individual ID in the Gedcom file',
      },
      generations: {
        type: Number,
        alias: 'g',
        description: 'The number of ascending generations to consider',
      },
      help: {
        type: Boolean,
        optional: true,
        alias: 'h',
        description: 'Prints this usage guide',
      },
    },
    {
      helpArg: 'help',
    }
  );

validateSourceGedcomFile(sourceGedcomFile);
validateTargetIcsFile(targetIcsFile);

const gedcomBuffer = fs.readFileSync(sourceGedcomFile);
const gedcom = readGedcom(gedcomBuffer);

const rootIndividual = gedcom.getIndividualRecord(individualId);
if (rootIndividual.length !== 1) {
  fail(
    `Error: found ${rootIndividual.length} individuals with ID ${individualId}`
  );
}

const rootIndividualId = rootIndividual[0].pointer ?? '';

const individuals = exploreAscendingDescending(
  gedcom,
  new Set([rootIndividualId]),
  generations
);
const events = [...individuals]
  .map(id => gedcom.getIndividualRecord(id))
  .sort((a, b) => getIndividualName(a).localeCompare(getIndividualName(b)))
  .map(individual => getBirthdayIfAlive(individual))
  .filter((event): event is EventAttributes => !!event);

const output = createEventsSync(events);

fs.writeFileSync(targetIcsFile, output, 'utf-8');

console.log(
  `Successfully wrote ${events.length} event${
    events.length !== 1 ? 's' : ''
  } to ${targetIcsFile}`
);
