import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { facultySchema } from '../src/types/faculty';
writeFileSync(
  'data/schemas/faculty.schema.json',
  JSON.stringify(
    z.toJSONSchema(facultySchema, { target: 'draft-2020-12', unrepresentable: 'any' }),
    null,
    2,
  ) + '\n',
);
console.log(
  'Generated structural schema; execute TypeScript validator for evidence and consent cross-checks.',
);
