import * as fs from 'node:fs';
import {fail} from './log';

export const validateSourceGedcomFile = (sourceGedcomFile: string) => {
  let sourceStat;
  try {
    sourceStat = fs.statSync(sourceGedcomFile);
  } catch (e) {
    if ((e as {code?: string}).code === 'ENOENT') {
      fail(
        `The provided source Gedcom file does not exist: ${sourceGedcomFile}`
      );
    }
    throw e;
  }
  if (sourceStat.isDirectory()) {
    fail(`The source Gedcom file is a directory: ${sourceGedcomFile}`);
  }
};

export const validateTargetIcsFile = (targetIcsFile: string) => {
  let targetStat;
  try {
    targetStat = fs.statSync(targetIcsFile);
  } catch (e) {
    if ((e as {code?: string}).code !== 'ENOENT') {
      throw e;
    }
  }
  if (targetStat !== undefined && !targetStat.isFile()) {
    fail(
      `The target ICS file already exists and is not a file: ${targetIcsFile}`
    );
  }
};
