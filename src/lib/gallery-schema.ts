import { z } from 'zod';

export const GALLERY_POSITIONS = ['after-hero', 'in-body', 'after-body'] as const;
export type GalleryPosition = (typeof GALLERY_POSITIONS)[number];

export const galleryImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1, 'Image alt text is required for SEO'),
  caption: z.string().optional(),
});

export const gallerySchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Gallery id must be a lowercase kebab-case slug'),
  title: z.string().optional(),
  position: z.enum(GALLERY_POSITIONS).default('after-hero'),
  images: z.array(galleryImageSchema).min(1, 'Gallery needs at least one image'),
});

export const galleriesSchema = z.array(gallerySchema).default([]);

export type GalleryImage = z.infer<typeof galleryImageSchema>;
export type Gallery = z.infer<typeof gallerySchema>;

/** HTML comment marker inserted into body for in-body gallery placement. */
export function galleryMarker(id: string): string {
  return `<!--gallery:${id}-->`;
}

export function galleryMarkerRegex(id?: string): RegExp {
  if (id) {
    return new RegExp(`<!--\\s*gallery:\\s*${id}\\s*-->`, 'i');
  }
  return /<!--\s*gallery:\s*([a-z0-9-]+)\s*-->/gi;
}
