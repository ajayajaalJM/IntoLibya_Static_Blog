import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { destinationFrontmatterSchema } from './lib/destination-schema';
import { postFrontmatterSchema } from './lib/post-schema';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: postFrontmatterSchema,
});

const destinations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/destinations' }),
  schema: destinationFrontmatterSchema,
});

export const collections = { posts, destinations };
