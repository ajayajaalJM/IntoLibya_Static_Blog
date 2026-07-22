import fs from 'node:fs';
import path from 'node:path';
import type { Lang } from '../../src/lib/post-schema';
import type { ContentKind } from '../../tools/blog-writer/lib/post-markdown';

export type TranslateJobStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface ManifestEntry {
  key: string;
  kind: ContentKind;
  translationGroup: string;
  lang: Lang;
  publishedAt: string;
  outPath: string;
  enPath: string;
}

export interface ProgressEntry {
  key: string;
  kind: ContentKind;
  translationGroup: string;
  lang: Lang;
  status: TranslateJobStatus;
  attempts?: number;
  error?: string;
  lastAttemptAt?: string;
  completedAt?: string;
  outPath?: string;
}

export interface SessionConfig {
  kind: 'posts' | 'destinations' | 'all';
  langs: Lang[];
  wave: number | null;
  order: 'publish' | 'alpha' | 'batch';
  group: string | null;
  force: boolean;
  updatedAt: string;
}

export interface TranslateState {
  manifest: ManifestEntry[];
  progress: Record<string, ProgressEntry>;
  session: SessionConfig | null;
}

const STATE_DIR = path.resolve('.translate-state');

export function jobKey(kind: ContentKind, translationGroup: string, lang: Lang): string {
  return `${kind}:${translationGroup}:${lang}`;
}

export function ensureStateDirs() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

export function stateLog(message: string) {
  ensureStateDirs();
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(path.join(STATE_DIR, 'translate.log'), line);
}

export function loadState(): TranslateState {
  ensureStateDirs();
  const read = <T>(file: string, fallback: T): T => {
    const p = path.join(STATE_DIR, file);
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
  };
  return {
    manifest: read('manifest.json', []),
    progress: read('progress.json', {}),
    session: read('session.json', null),
  };
}

export function saveState(state: TranslateState) {
  ensureStateDirs();
  fs.writeFileSync(path.join(STATE_DIR, 'manifest.json'), JSON.stringify(state.manifest, null, 2));
  fs.writeFileSync(path.join(STATE_DIR, 'progress.json'), JSON.stringify(state.progress, null, 2));
  if (state.session) {
    fs.writeFileSync(path.join(STATE_DIR, 'session.json'), JSON.stringify(state.session, null, 2));
  }
}

export function resetInFlight(state: TranslateState) {
  for (const entry of Object.values(state.progress)) {
    if (entry.status === 'in_progress') entry.status = 'pending';
  }
}

export function reconcileWithFilesystem(state: TranslateState) {
  for (const entry of state.manifest) {
    const progress = state.progress[entry.key];
    if (!progress) continue;
    if (progress.status === 'completed') continue;
    if (fs.existsSync(entry.outPath)) {
      progress.status = 'completed';
      progress.outPath = entry.outPath;
      progress.completedAt = progress.completedAt ?? new Date().toISOString();
      progress.error = undefined;
    }
  }
}

export function syncProgressFromManifest(state: TranslateState) {
  for (const entry of state.manifest) {
    if (!state.progress[entry.key]) {
      state.progress[entry.key] = {
        key: entry.key,
        kind: entry.kind,
        translationGroup: entry.translationGroup,
        lang: entry.lang,
        status: 'pending',
        outPath: entry.outPath,
      };
    } else {
      const progress = state.progress[entry.key];
      progress.kind = entry.kind;
      progress.translationGroup = entry.translationGroup;
      progress.lang = entry.lang;
      progress.outPath = entry.outPath;
    }
  }
}

export function countManifestStats(state: TranslateState) {
  const entries = state.manifest.map((m) => state.progress[m.key]).filter(Boolean) as ProgressEntry[];
  const total = state.manifest.length;
  return {
    total,
    completed: entries.filter((e) => e.status === 'completed').length,
    failed: entries.filter((e) => e.status === 'failed').length,
    inProgress: entries.filter((e) => e.status === 'in_progress').length,
    pending: entries.filter((e) => e.status === 'pending').length,
    entries,
  };
}

export function formatProgressBar(completed: number, total: number, width = 24): string {
  if (total <= 0) return `[${'░'.repeat(width)}] 0/0`;
  const filled = Math.min(width, Math.round((completed / total) * width));
  return `[${'█'.repeat(filled)}${'░'.repeat(width - filled)}] ${completed}/${total}`;
}

export function renderLiveProgress(args: {
  overallCompleted: number;
  overallTotal: number;
  runDone: number;
  runTotal: number;
  currentJob?: string;
  label?: string;
}) {
  const overall = formatProgressBar(args.overallCompleted, args.overallTotal);
  const run = formatProgressBar(args.runDone, args.runTotal);
  const prefix = args.label ? `${args.label} ` : '';
  const job = args.currentJob ? `  ${args.currentJob}` : '';
  const line = `${prefix}Overall ${overall}  |  This run ${run}${job}`;

  if (process.stdout.isTTY) {
    process.stdout.write(`\r\x1b[K${line}`);
  } else {
    console.log(line);
  }
}

export function finishLiveProgress() {
  if (process.stdout.isTTY) process.stdout.write('\n');
}

export function printStatus(state: TranslateState) {
  const stats = countManifestStats(state);
  const { total, completed, failed, inProgress, pending, entries } = stats;
  const pct = total ? ((completed / total) * 100).toFixed(1) : '0.0';
  const bar = formatProgressBar(completed, total);

  console.log('\nLocale translation batch');
  console.log('─────────────────────────────────────────');
  if (state.session) {
    const langs = state.session.langs.join(',');
    console.log(`  filters     kind=${state.session.kind} langs=${langs} order=${state.session.order}`);
    if (state.session.wave != null) console.log(`  wave        ${state.session.wave}`);
    if (state.session.group) console.log(`  group       ${state.session.group}`);
    if (state.session.force) console.log('  force       true (will overwrite existing locale files)');
  }
  console.log(`  completed   ${completed} / ${total}  (${pct}%)`);
  console.log(`  pending     ${pending} / ${total}`);
  console.log(`  failed      ${failed} / ${total}`);
  if (inProgress) console.log(`  in_progress ${inProgress}`);
  console.log('─────────────────────────────────────────');
  console.log(`  ${bar}`);

  const recentFails = entries.filter((e) => e.status === 'failed').slice(-5);
  if (recentFails.length) {
    console.log('\n  Recent failures:');
    for (const f of recentFails) {
      console.log(`    ${f.key}  — ${f.error ?? 'unknown error'}`);
    }
    console.log('\n  Run with --retry-failed to re-attempt failed jobs.');
  }
  console.log('');
}
