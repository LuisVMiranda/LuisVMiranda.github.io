import { z } from 'zod';

export const sectionIdSchema = z.enum([
  'brasil',
  'mundo',
  'politica',
  'economia',
  'tecnologia',
  'ciencia',
  'cultura',
  'esportes',
]);
const timestamp = z.iso.datetime({ offset: true });
const translation = z.object({
  title: z.string().trim().min(5),
  summary: z.string().trim().min(15),
  paragraphs: z.array(z.string().trim().min(20)).min(2),
  correction: z.string().trim().min(5).optional(),
});
export const articleSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    section: sectionIdSchema,
    secondarySections: z.array(sectionIdSchema),
    publishedAt: timestamp,
    publishedDate: z.iso.date().optional(),
    updatedAt: timestamp,
    sources: z
      .array(
        z.object({
          name: z.string().min(2),
          url: z
            .url()
            .refine(
              (value) => /^https:\/\//.test(value),
              'HTTPS source required',
            ),
        }),
      )
      .min(1),
    translations: z.object({ 'pt-BR': translation, en: translation }),
  })
  .refine(
    (article) =>
      Date.parse(article.updatedAt) >= Date.parse(article.publishedAt),
    {
      message: 'Update date cannot precede publication',
    },
  );
const sectionEdition = z.object({
  articleIds: z.array(z.string()).max(10),
  shortfall: z.string(),
  shortfallEn: z.string().optional(),
});
export const editionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  cutoff: timestamp,
  sections: z.record(sectionIdSchema, sectionEdition),
  leadArticleId: z.string().optional(),
});
export const approvalSchema = z.object({
  revision: z.string().regex(/^[a-f0-9]{64}$/),
  approvedBy: z.string().trim().min(2),
  approvedAt: timestamp,
});
