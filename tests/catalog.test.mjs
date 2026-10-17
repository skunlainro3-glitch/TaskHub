import test from 'node:test';
import assert from 'node:assert/strict';
import {referenceCatalog as catalog} from '../server/catalog.mjs';

test('approved reference tours retain provenance and unknown operational fields', () => {
  assert.equal(catalog.source.url, 'https://dulichenvietcs.netlify.app/');
  assert.equal(catalog.source.capturedOn, '2026-10-17');
  assert.equal(catalog.tours.length, 13);
  assert.equal(new Set(catalog.tours.map(t => t.code)).size, 13);
  for (const tour of catalog.tours) {
    assert.equal(tour.departure, null, 'Recurring text is not a confirmed calendar date');
    assert.equal(tour.capacity, null, 'The source does not report seat capacity');
    assert.equal(tour.reserved, null, 'The source does not report booked seats');
    assert.equal(tour.sourceUrl, catalog.source.url);
    assert.equal(new URL(tour.sourceImage).origin, new URL(catalog.source.url).origin);
    if(tour.image) assert.equal(tour.image, tour.sourceImage);
    assert.ok(tour.route && tour.departureNote && tour.highlights.length);
    assert.ok(!('published' in tour) && !('workspace' in tour));
  }
});

test('contact-only pricing stays unknown and source prices keep their VND values', () => {
  const find = code => catalog.tours.find(t => t.code === code);
  assert.equal(find('EVG-TQ11').price, null);
  assert.equal(find('EVG-TQ11').airline, null);
  assert.equal(find('EVG-TQ01').price, 28990000);
  assert.equal(find('EVG-NB19').price, 37888000);
  assert.equal(find('EVG-EU22').price, 75900000);
  assert.equal(find('EVG-TQ11').image, null, 'Unrelated Taj Mahal image must not illustrate a China tour');
  assert.equal(catalog.tours.filter(t => t.price === null).length, 1);
});
