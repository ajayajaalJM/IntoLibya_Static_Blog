import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { postFrontmatterSchema } from './lib/post-schema';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: postFrontmatterSchema,
});

export const collections = { posts };
