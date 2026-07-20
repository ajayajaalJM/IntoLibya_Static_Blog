/** Shared publish gate for posts and destinations. */

export type Publishable = {
  draft?: boolean;
  publishedAt: Date;
};

/**
 * Publicly visible at build/serve time: not a draft, and publishedAt has arrived.
 * Future-dated posts with draft: false stay hidden until a rebuild on/after that date.
 */
export function isPubliclyVisible(
  data: Publishable,
  now: Date = new Date(),
): boolean {
  if (data.draft === true) return false;
  return data.publishedAt.getTime() <= now.getTime();
}
