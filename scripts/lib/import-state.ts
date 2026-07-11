import fs from 'node:fs';
import path from 'node:path';

export type ImportStatus =
  | 'pending'
  | 'fetching'
  | 'fetched'
  | 'writing'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface ProgressEntry {
  wpId: number;
  slug: string;
  canonicalPath: string;
  lang: string;
  status: ImportStatus;
  attempts?: number;
  error?: string;
  lastAttemptAt?: string;
  mdPath?: string;
}

export interface ManifestEntry {
  wpId: number;
  slug: string;
  canonicalPath: string;
  lang: string;
}

export interface ImportState {
  manifest: ManifestEntry[];
  progress: Record<string, ProgressEntry>;
  fetchCheckpoint: { page: number; totalPages: number | null };
}

const STATE_DIR = path.resolve('.import-state');
const CACHE_DIR = path.join(STATE_DIR, 'cache');

export function ensureStateDirs() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export function cachePath(wpId: number) {
  return path.join(CACHE_DIR, `${wpId}.json`);
}

export function log(message: string) {
  ensureStateDirs();
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(path.join(STATE_DIR, 'import.log'), line);
  console.log(message);
}

export function loadState(): ImportState {
  ensureStateDirs();
  const read = (file: string, fallback: unknown) => {
    const p = path.join(STATE_DIR, file);
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  };
  return {
    manifest: read('manifest.json', []) as ManifestEntry[],
    progress: read('progress.json', {}) as Record<string, ProgressEntry>,
    fetchCheckpoint: read('fetch-checkpoint.json', { page: 1, totalPages: null }) as ImportState['fetchCheckpoint'],
  };
}

export function saveState(state: ImportState) {
  ensureStateDirs();
  fs.writeFileSync(path.join(STATE_DIR, 'manifest.json'), JSON.stringify(state.manifest, null, 2));
  fs.writeFileSync(path.join(STATE_DIR, 'progress.json'), JSON.stringify(state.progress, null, 2));
  fs.writeFileSync(path.join(STATE_DIR, 'fetch-checkpoint.json'), JSON.stringify(state.fetchCheckpoint, null, 2));
}

export function resetInFlight(state: ImportState) {
  for (const entry of Object.values(state.progress)) {
    if (entry.status === 'fetching') entry.status = 'pending';
    if (entry.status === 'writing') entry.status = 'fetched';
  }
}

export function progressKey(wpId: number) {
  return String(wpId);
}

export function printStatus(state: ImportState) {
  const entries = Object.values(state.progress);
  const total = state.manifest.length || entries.length;
  const completed = entries.filter((e) => e.status === 'completed').length;
  const failed = entries.filter((e) => e.status === 'failed').length;
  const pending = entries.filter((e) => e.status === 'pending' || e.status === 'fetched').length;
  const pct = total ? ((completed / total) * 100).toFixed(1) : '0.0';
  const barLen = 24;
  const filled = total ? Math.round((completed / total) * barLen) : 0;
  const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);

  console.log('\nWordPress → Markdown Import');
  console.log('─────────────────────────────────────────');
  console.log(`  completed   ${completed} / ${total}  (${pct}%)`);
  console.log(`  failed      ${failed} / ${total}`);
  console.log(`  pending     ${pending} / ${total}`);
  console.log(`  last fetch  page ${state.fetchCheckpoint.page}${state.fetchCheckpoint.totalPages ? ` of ${state.fetchCheckpoint.totalPages}` : ''}`);
  console.log('─────────────────────────────────────────');
  console.log(`  [${bar}] ${completed}/${total}`);

  const recentFails = entries.filter((e) => e.status === 'failed').slice(-5);
  if (recentFails.length) {
    console.log('\n  Recent failures:');
    for (const f of recentFails) {
      console.log(`    WP#${f.wpId}  ${f.canonicalPath}  — ${f.error}`);
    }
    console.log('\n  Run with --retry-failed to re-attempt failed items.');
  }
  console.log('');
}
