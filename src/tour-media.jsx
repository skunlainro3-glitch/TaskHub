import React, { useId, useState } from "react";
import { resolveTourMedia } from "./tour-media-data.mjs";
import "./tour-media.css";

function DestinationIllustration() {
  const gradientId = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 800 450"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x2="0" y2="1">
          <stop stopColor="#d9edff" />
          <stop offset="1" stopColor="#edf7ff" />
        </linearGradient>
      </defs>
      <path fill={`url(#${gradientId})`} d="M0 0h800v450H0z" />
      <circle cx="621" cy="98" r="47" fill="#fff" opacity=".82" />
      <path
        d="M0 313 155 148l132 147L459 96l218 238 123-116v232H0Z"
        fill="#a9cbe8"
      />
      <path d="m350 219 109-123 116 126-81-35-35 28-31-24Z" fill="#f7fbff" />
      <path d="M0 340q200-60 400 10t400-10v110H0Z" fill="#7db0da" />
      <path d="M0 395q200-48 400 0t400 0v55H0Z" fill="#5693c5" />
      <path
        d="M108 369h88m339 42h113"
        stroke="#eef8ff"
        strokeWidth="4"
        strokeLinecap="round"
        opacity=".7"
      />
    </svg>
  );
}

// No links inside this element: tour cards place it inside their open button.
// Put TourImageCredit below the image in the details panel for clickable credits.
export function TourMedia({
  tour = {},
  className = "",
  large = false,
  priority = false,
}) {
  const [failedSources, setFailedSources] = useState([]);
  const media = resolveTourMedia(tour, failedSources);
  return (
    <div
      className={`tour-media ${large ? "tour-media-large" : ""} ${className}`.trim()}
    >
      {media ? (
        <img
          src={media.image}
          srcSet={media.srcSet}
          sizes={media.srcSet ? large ? '(max-width: 650px) 90vw, 850px' : '(max-width: 650px) 90vw, (max-width: 1100px) 44vw, 380px' : undefined}
          alt={`${media.title} — ảnh minh họa điểm đến`}
          width={media.width || 960}
          height={media.height || 600}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSources((failed) => [...failed, media.image])}
        />
      ) : (
        <DestinationIllustration />
      )}
      <span className="tour-media-label">
        {media ? "Ảnh minh họa" : "Minh họa điểm đến"}
      </span>
    </div>
  );
}

export function TourImageCredit({ tour = {} }) {
  const media = resolveTourMedia(tour);
  if (!media)
    return (
      <p className="tour-image-credit">
        Hình minh họa đồ họa, không phải ảnh của chuyến đi.
      </p>
    );
  if (media.externalSource) {
    return (
      <p className="tour-image-credit">
        Ảnh minh họa từ{" "}
        {media.sourceUrl ? (
          <a href={media.sourceUrl} target="_blank" rel="noopener noreferrer">
            nguồn thông tin tour
          </a>
        ) : (
          "nguồn thông tin tour"
        )}
        . Hình thực tế có thể khác.
      </p>
    );
  }
  return (
    <p className="tour-image-credit">
      Ảnh minh họa:{" "}
      <a href={media.sourceUrl} target="_blank" rel="noopener noreferrer">
        {media.title}
      </a>
      {" · "}
      {media.author}
      {" · "}
      <a href={media.licenseUrl} target="_blank" rel="noopener noreferrer">
        {media.license}
      </a>
      . Dùng bản thu nhỏ/WebP; khung hiển thị có thể cắt ảnh. Không phải ảnh đoàn
      khách của TaskHub.
    </p>
  );
}
