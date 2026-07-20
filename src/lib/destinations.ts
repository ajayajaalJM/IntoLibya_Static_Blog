import { getCollection } from 'astro:content';
import type { Lang } from './post-schema';
import { isPubliclyVisible } from './publish';

export async function getAllDestinationsIncludingDrafts() {
  const destinations = await getCollection('destinations');
  return destinations.sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime(),
  );
}

/** Live destinations only: not draft, and publishedAt has arrived (build-time now). */
export async function getAllDestinations() {
  return (await getAllDestinationsIncludingDrafts()).filter((d) =>
    isPubliclyVisible(d.data),
  );
}

export async function getDestinationsByLang(lang: Lang) {
  return (await getAllDestinations()).filter((d) => d.data.lang === lang);
}

export function getDestinationTranslationSiblings(
  destination: Awaited<ReturnType<typeof getAllDestinationsIncludingDrafts>>[number],
  all: Awaited<ReturnType<typeof getAllDestinationsIncludingDrafts>>,
) {
  return all.filter(
    (d) =>
      d.data.translationGroup === destination.data.translationGroup && d.id !== destination.id,
  );
}
