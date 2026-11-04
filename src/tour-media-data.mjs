// Photos are illustrative destination views, never evidence of a sold tour.
// Keep the original photo license separate from the application's code license.
import {tourImageVariants, unavailableTourImageSources} from './tour-image-variants.mjs';
function responsivePhoto(photo,failed) {
  const variant=tourImageVariants[photo.image];
  return variant&&!failed.includes(variant.image)?{...photo,...variant}:photo;
}
export const TOUR_PHOTOS = [
  {
    key: "hoi-an",
    image: "/images/tours/hoi-an.jpg",
    title: "Bến thuyền và phố cổ Hội An",
    author: "David McKelvey",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Hoi_An_Ancient_Town,_Vietnam_(7090654493).jpg",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    width: 960,
    height: 539,
    destinations: ["hoi an", "da nang", "quang nam"],
  },
  {
    key: "phu-quoc",
    image: "/images/tours/phu-quoc.jpg",
    title: "Bãi biển Phú Quốc",
    author: "FrogsLegs71",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Phu_Quoc_Beach.jpg",
    license: "CC BY-SA 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
    width: 960,
    height: 720,
    destinations: ["phu quoc", "kien giang"],
  },
  {
    key: "quy-nhon",
    image: "/images/tours/quy-nhon.jpg",
    title: "Biển Quy Nhơn nhìn từ tượng nhạc sĩ Trịnh Công Sơn",
    author: "Tandaivietnam",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Biển_Quy_Nhơn_nhìn_từ_tượng_nhạc_sĩ_Trịnh_Công_Sơn.jpg",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    width: 960,
    height: 556,
    destinations: ["quy nhon", "ky co", "eo gio", "binh dinh"],
  },
];

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function safeImageUrl(value) {
  if (typeof value !== "string") return "";
  if (value.startsWith("/images/") && !value.includes("\\")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export function destinationPhoto(tour = {}) {
  const destination = normalize(tour.destination);
  const title = normalize(tour.title);
  const contains = (text, place) => (` ${text} `).includes(` ${place} `);
  const direct = TOUR_PHOTOS.find((photo) =>
    photo.destinations.some((place) => contains(destination, place)),
  );
  if (direct) return direct;
  // A specific destination takes precedence over words in the title. This
  // prevents a Vietnamese stock photo appearing on an unrelated foreign tour.
  const broadDestination = !destination || /^(viet nam|vietnam|noi dia|mien trung|mien nam|mien bac)$/.test(destination);
  return broadDestination
    ? TOUR_PHOTOS.find((photo) =>
        photo.destinations.some((place) => contains(title, place)),
      ) || null
    : null;
}

export function resolveTourMedia(tour = {}, failedSources = []) {
  const provided = safeImageUrl(tour.image || tour.sourceImage);
  if (provided && !unavailableTourImageSources.includes(provided) && !failedSources.includes(provided)) {
    return responsivePhoto({
      image: provided,
      title: tour.title || tour.destination || "Điểm đến",
      sourceUrl: safeImageUrl(tour.sourceUrl),
      externalSource: true,
    },failedSources);
  }
  const photo = destinationPhoto(tour);
  return photo && !failedSources.includes(photo.image) ? responsivePhoto(photo,failedSources) : null;
}
