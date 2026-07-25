const CLOUDINARY_HOST = 'res.cloudinary.com';

/** Adds delivery transformations only to untransformed Cloudinary image URLs. */
export function optimizeCloudinaryImage(src: string, width: number) {
  if (!src) return src;

  try {
    const url = new URL(src);
    if (url.hostname !== CLOUDINARY_HOST) return src;

    const marker = '/image/upload/';
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return src;

    const suffix = url.pathname.slice(markerIndex + marker.length);
    const firstSegment = suffix.split('/')[0];
    if (/(^|,)(?:f_|q_|dpr_|w_|h_|c_)/.test(firstSegment)) return src;

    const safeWidth = Math.max(1, Math.round(width));
    url.pathname = url.pathname.replace(
      marker,
      `${marker}f_auto,q_auto,dpr_auto,w_${safeWidth}/`,
    );
    return url.toString();
  } catch {
    return src;
  }
}
