import {parse} from 'ts-command-line-args';
import * as fs from 'node:fs';
import {validateSourceGedcomFile, validateTargetIcsFile} from './cliUtils';
import {readGedcom} from 'read-gedcom';
import {fail} from './log';
import {createEventsSync, getBirthdayIfAlive} from './converter';

interface CliArguments {
  sourceGedcomFile: string;
  targetIcsFile: string;
  individualId: string;
  help?: boolean;
}

const {sourceGedcomFile, targetIcsFile, individualId} = parse<CliArguments>(
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

const individual = gedcom.getIndividualRecord(individualId);
if (individual.length !== 1) {
  fail(`Error: found ${individual.length} individuals with ID ${individualId}`);
}

const event = getBirthdayIfAlive(individual);
const output = createEventsSync(event ? [event] : []);

fs.writeFileSync(targetIcsFile, output, 'utf-8');
