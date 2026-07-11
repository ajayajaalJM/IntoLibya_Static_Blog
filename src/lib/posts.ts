import { getCollection } from 'astro:content';
import type { Lang } from './post-schema';

export async function getAllPosts() {
  const posts = await getCollection('posts');
  return posts.sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );
}

export async function getPostsByLang(lang: Lang) {
  return (await getAllPosts()).filter((p) => p.data.lang === lang);
}

export async function getLatestPosts(lang: Lang, limit = 3) {
  return (await getPostsByLang(lang)).slice(0, limit);
}

export function getTranslationSiblings(
  post: Awaited<ReturnType<typeof getAllPosts>>[number],
  all: Awaited<ReturnType<typeof getAllPosts>>,
) {
  return all.filter(
    (p) => p.data.translationGroup === post.data.translationGroup && p.id !== post.id,
  );
}
