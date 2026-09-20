import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { articleSchema } from './modules/content/schema';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './content/articles' }),
  schema: articleSchema,
});
export const collections = { articles };
