import { getYoutubeEmbedUrl } from "@/lib/video";

export function VideoPreview({ title, videoUrl }: { title: string; videoUrl: string }) {
  const youtubeEmbedUrl = getYoutubeEmbedUrl(videoUrl);

  if (youtubeEmbedUrl) {
    return (
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-32 w-full"
        loading="lazy"
        src={youtubeEmbedUrl}
        title={title}
      />
    );
  }

  return <video src={videoUrl} className="h-32 w-full object-cover" controls muted />;
}
