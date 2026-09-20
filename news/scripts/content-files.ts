import { readdir, readFile } from 'node:fs/promises';
import {
  articleSchema,
  editionSchema,
  approvalSchema,
} from '../src/modules/content/schema';
import { validateCatalog } from '../src/modules/editions/integrity';

export async function readContent() {
  const names = (await readdir('content/articles')).filter((name) =>
    name.endsWith('.json'),
  );
  const articles = await Promise.all(
    names.map(async (name) =>
      articleSchema.parse(
        JSON.parse(await readFile(`content/articles/${name}`, 'utf8')),
      ),
    ),
  );
  const editions = editionSchema
    .array()
    .parse(JSON.parse(await readFile('content/editions.json', 'utf8')));
  const approval = approvalSchema
    .nullable()
    .parse(JSON.parse(await readFile('content/approval.json', 'utf8')));
  validateCatalog(articles, editions);
  return { articles, editions, approval };
}
