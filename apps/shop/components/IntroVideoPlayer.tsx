"use client";

import { getYoutubeEmbedUrl } from "../lib/video";

export function IntroVideoPlayer({ title, videoUrl }: { title: string; videoUrl: string }): React.ReactElement {
  const youtubeEmbedUrl = getYoutubeEmbedUrl(videoUrl);

  if (youtubeEmbedUrl) {
    return (
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        src={youtubeEmbedUrl}
        title={title}
      />
    );
  }

  return <video src={videoUrl} controls playsInline preload="metadata" />;
}
