import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Cada texto é um arquivo .md em src/content/escritos/.
const escritos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/escritos' }),
  schema: z.object({
    title: z.string().min(1, 'Todo texto publicado precisa de um título'),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    slug: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false), // draft: true = não aparece no site
    description: z.string().optional(),
    location: z.string().optional(),
    originalUrl: z.string().url().optional(),
    bloggerId: z.string().optional(),
    bloggerType: z.string().optional(),
    bloggerStatus: z.string().optional(),
    lang: z.string().default('pt-BR'),
  }),
});

export const collections = { escritos };
