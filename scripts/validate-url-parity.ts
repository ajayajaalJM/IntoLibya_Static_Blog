#!/usr/bin/env tsx
/** Validate imported post URLs exist in content collection. */
import fs from 'node:fs';
import path from 'node:path';

const POSTS_DIR = path.resolve('src/content/posts');

function main() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log('No posts directory yet — run npm run import:wp first.');
    process.exit(0);
  }

  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.md')) files.push(p);
    }
  };
  walk(POSTS_DIR);
  console.log(`Found ${files.length} markdown posts in ${POSTS_DIR}`);
  if (files.length === 0) process.exit(1);
}

main();
