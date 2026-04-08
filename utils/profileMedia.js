export const getProfileMediaUrl = (item) => {
  if (!item) return null;
  if (typeof item === "string") return item;
  if (typeof item !== "object") return null;

  return item.url || item.uri || item.secure_url || item.imageUrl || item.src || null;
};

export const getProfileMediaType = (item) => {
  if (!item || typeof item === "string") return "image";

  const explicitType = typeof item.type === "string" ? item.type.toLowerCase() : "";
  if (explicitType === "video" || explicitType.startsWith("video/")) return "video";
  if (explicitType === "image" || explicitType.startsWith("image/")) return "image";

  const mimeType = typeof item.mimeType === "string" ? item.mimeType.toLowerCase() : "";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";

  const uri = getProfileMediaUrl(item) || "";
  if (/\.(mp4|mov|m4v|webm|avi|mkv)(\?|$)/i.test(uri)) return "video";

  return "image";
};

export const isProfileVideo = (item) => getProfileMediaType(item) === "video";

export const normalizeProfileMedia = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      if (!item) return null;
      if (typeof item === "string") {
        return {
          url: item,
          type: "image",
          order: index,
        };
      }

      if (typeof item !== "object") return null;

      const url = getProfileMediaUrl(item);
      if (!url) return null;

      return {
        ...item,
        url,
        type: getProfileMediaType(item),
        order: typeof item.order === "number" ? item.order : index,
      };
    })
    .filter(Boolean);
};

export const getFirstProfileImageUrl = (items) => {
  const mediaItems = normalizeProfileMedia(items);
  const firstImage = mediaItems.find((item) => getProfileMediaType(item) === "image");
  return firstImage ? getProfileMediaUrl(firstImage) : null;
};