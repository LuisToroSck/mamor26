import { writeFile } from 'node:fs/promises';
import { typeScriptUrl } from './load-typescript.mjs';
const { GIFT_IDS, TOTAL_GIFTS } = await import(await typeScriptUrl('../src/app/adventure.data.ts'));
const ids = GIFT_IDS.map(id => `          '${id}'`).join(',\n');
const rules = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /collections/{owner} {
      allow read, write: if owner == "luis"
                         || owner == "martin"
                         || owner == "luis-ash";
      match /pokemon/{pokemonId} {
        allow read, write: if owner == "luis"
                           || owner == "martin"
                           || owner == "luis-ash";
      }
    }
    match /mamor26Progress/birthday {
      allow get: if true;
      allow create, update: if
        request.resource.data.keys().hasOnly(['found', 'updatedAt', 'version']) &&
        request.resource.data.keys().hasAll(['found', 'updatedAt', 'version']) &&
        request.resource.data.version == 1 &&
        request.resource.data.updatedAt == request.time &&
        request.resource.data.found is list &&
        request.resource.data.found.size() <= ${TOTAL_GIFTS} &&
        request.resource.data.found.toSet().size() == request.resource.data.found.size() &&
        request.resource.data.found.hasOnly([
${ids}
        ]);
    }
  }
}
`;
await writeFile(new URL('../docs/firestore.rules', import.meta.url), rules, 'utf8');
console.log(`Reglas generadas para ${TOTAL_GIFTS} aperturas. No se publicaron en Firebase.`);
