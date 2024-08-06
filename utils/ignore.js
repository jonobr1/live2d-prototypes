/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

/**
 * Preprends ts-ignore and eslint-ignore to all TypeScript
 * and JavaScript files in a directory
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'path';
import process from 'process';

const injection =
  Buffer.from(`/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
`);

process.argv.slice(2).map(async (folder) => {
  const dir = path.resolve(import.meta.dirname, '../', folder);
  try {
    const files = await readdir(dir, {
      recursive: true,
    });
    await files.map(async (filename) => {
      if (/\.(ts|tsx|js|jsx)$/i.test(filename)) {
        const uri = path.resolve(dir, filename);
        const contents = await readFile(uri);
        if (!contents.toString().includes(injection.toString())) {
          try {
            await writeFile(uri, [injection, contents]);
          } catch (e) {
            console.log(e);
          }
        }
        console.log('Ignoring TypeScript and eslint errors at', uri);
      }
    });
  } catch (e) {
    console.log(e);
  }
});
