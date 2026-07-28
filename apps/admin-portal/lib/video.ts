export function getYoutubeEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

    if (hostname === "youtu.be") {
      const id = url.pathname.split("/").find(Boolean);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (hostname !== "youtube.com") {
      return null;
    }

    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    const [kind, id] = url.pathname.split("/").filter(Boolean);
    if ((kind === "shorts" || kind === "embed") && id) {
      return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }

  return null;
}
