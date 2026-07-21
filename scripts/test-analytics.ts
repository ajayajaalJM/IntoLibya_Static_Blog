/**
 * Analytics contract unit tests (blog classifier).
 * Run: npm run test:analytics
 */
import assert from 'node:assert/strict';
import {
  buildHandoffContext,
  classifyLink,
  HANDOFF_STORAGE_KEY,
  isTourBuilderHref,
} from '../src/lib/analytics.ts';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    console.error(`FAIL - ${name}`);
    throw e;
  }
}

test('selectedTour beats bare booking CTA', () => {
  const p = classifyLink({
    href: '/tourbuilder/booking?selectedTour=coastal-5',
    text: 'Coastal Tour',
    section: 'tours',
  });
  assert.equal(p.event, 'select_item');
  assert.equal(p.item_category, 'tour');
  assert.equal(p.item_id, 'coastal-5');
});

test('selectedEvent classified as event item', () => {
  const p = classifyLink({
    href: '/tourbuilder/booking?selectedEvent=ev-1',
    text: 'Book Event',
    section: 'events',
  });
  assert.equal(p.event, 'select_item');
  assert.equal(p.item_category, 'event');
  assert.equal(p.item_id, 'ev-1');
});

test('bare booking is cta build_trip', () => {
  const p = classifyLink({
    href: '/tourbuilder/booking',
    text: 'Build Your Trip',
    section: 'final_cta',
  });
  assert.equal(p.event, 'cta_click');
  assert.equal(p.cta_name, 'build_trip');
});

test('activity path is select_item', () => {
  const p = classifyLink({
    href: '/tourbuilder/activity/tripoli-medina-walk-a12',
    text: 'Medina walk',
    section: 'activities',
  });
  assert.equal(p.event, 'select_item');
  assert.equal(p.item_category, 'activity');
});

test('destination detail is content_select destination', () => {
  const p = classifyLink({
    href: '/en/destination/tripoli',
    text: 'Tripoli',
    section: 'article',
  });
  assert.equal(p.event, 'content_select');
  assert.equal(p.content_type, 'destination');
  assert.equal(p.content_id, 'tripoli');
});

test('post path is content_select post', () => {
  const p = classifyLink({
    href: '/en/visit-libya-2026',
    text: 'Visit Libya',
  });
  assert.equal(p.event, 'content_select');
  assert.equal(p.content_type, 'post');
  assert.equal(p.content_id, 'visit-libya-2026');
});

test('data-ga-item attrs preferred', () => {
  const p = classifyLink({
    href: '/tourbuilder/booking?selectedTour=x',
    itemId: 'explicit-id',
    itemType: 'tour',
    itemName: 'Explicit',
    itemIndex: '2',
    section: 'tours',
  });
  assert.equal(p.event, 'select_item');
  assert.equal(p.item_id, 'explicit-id');
  assert.equal(p.index, 2);
});

test('handoff helpers', () => {
  assert.equal(HANDOFF_STORAGE_KEY, 'il_tb_entry_v1');
  assert.equal(isTourBuilderHref('/tourbuilder/booking'), true);
  const raw = buildHandoffContext({
    entry_page: '/en/foo',
    entry_content_id: 'foo',
    entry_section: 'final_cta',
    entry_item_id: 't1',
  });
  const parsed = JSON.parse(raw);
  assert.equal(parsed.entry_page, '/en/foo');
  assert.equal(parsed.entry_item_id, 't1');
});

test('no PII keys in classifier output', () => {
  const p = classifyLink({
    href: 'mailto:person@example.com',
    text: 'Email us',
  });
  assert.equal(p.event, 'contact_click');
  assert.equal(p.contact_method, 'email');
  assert.ok(!('email' in p));
  assert.ok(!Object.values(p).some((v) => typeof v === 'string' && v.includes('@example.com') && v.startsWith('mailto:') === false));
});

console.log('All blog analytics tests passed.');
