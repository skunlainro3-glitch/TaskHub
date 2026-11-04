import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { TOUR_PHOTOS, destinationPhoto, resolveTourMedia, safeImageUrl } from "../src/tour-media-data.mjs";
import {tourImageVariants,unavailableTourImageSources} from '../src/tour-image-variants.mjs';

test("destination photos match Vietnamese accents without using unrelated theme defaults", () => {
  assert.equal(destinationPhoto({ destination: "Đà Nẵng - Hội An" }).key, "hoi-an");
  assert.equal(destinationPhoto({ destination: "Phú Quốc" }).key, "phu-quoc");
  assert.equal(destinationPhoto({ title: "Quy Nhơn - Kỳ Co - Eo Gió", destination: "Việt Nam" }).key, "quy-nhon");
  assert.equal(destinationPhoto({ destination: "Nhật Bản", title: "Hội An và Tokyo", theme: "danang" }), null);
  assert.equal(destinationPhoto({ destination: "Thái Lan", theme: "danang" }), null);
});

test('responsive assets use real WebP files and known missing source photos skip network retries',()=>{
  for(const photo of TOUR_PHOTOS){
    const variant=tourImageVariants[photo.image];assert.ok(variant.srcSet.includes('480w'));
    const file=readFileSync(new URL('../public'+variant.image,import.meta.url));assert.equal(file.subarray(8,12).toString(),'WEBP');
    assert.ok(file.length<readFileSync(new URL('../public'+photo.image,import.meta.url)).length);
    assert.equal(resolveTourMedia({destination:photo.destinations[0]}).image,variant.image);
    assert.equal(resolveTourMedia({destination:photo.destinations[0]},[variant.image]).image,photo.image);
  }
  assert.equal(resolveTourMedia({destination:'Trung Quốc',sourceImage:unavailableTourImageSources[0]}),null);
});

test("provided source images take precedence and failure has an honest destination-specific fallback", () => {
  const tour = { destination: "Phú Quốc", image: "https://example.com/tour.jpg", sourceUrl: "https://example.com/" };
  assert.equal(resolveTourMedia(tour).externalSource, true);
  assert.equal(resolveTourMedia(tour, [tour.image]).key, "phu-quoc");
  assert.equal(resolveTourMedia(tour, [tour.image, "/images/tours/phu-quoc.jpg"]), null);
  assert.equal(resolveTourMedia({ destination: "Trung Quốc", image: tour.image }, [tour.image]), null);
});

test("photo metadata has source, license and compact local asset paths; insecure URLs are excluded", () => {
  const credits = readFileSync(new URL("../public/images/tours/credits.html", import.meta.url), "utf8");
  for (const photo of TOUR_PHOTOS) {
    assert.match(photo.image, /^\/images\/tours\/[a-z-]+\.jpg$/);
    assert.match(photo.sourceUrl, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.match(photo.licenseUrl, /^https:\/\/creativecommons\.org\/licenses\//);
    assert.ok(photo.author && photo.width <= 1200);
    const asset = readFileSync(new URL(`../public${photo.image}`, import.meta.url));
    assert.equal(asset.readUInt16BE(0), 0xffd8, "asset must be an actual JPEG rather than an error page");
    assert.ok(asset.length < 250_000, "destination thumbnails stay within the mobile image budget");
    assert.ok(credits.includes(photo.author) && credits.includes(photo.licenseUrl));
  }
  assert.equal(safeImageUrl("javascript:alert(1)"), "");
  assert.equal(safeImageUrl("http://example.com/image.jpg"), "");
  assert.equal(safeImageUrl("//example.com/image.jpg"), "");
});
