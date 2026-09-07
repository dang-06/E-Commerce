"use client";

import Script from "next/script";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getMetaPixelId, trackPageView } from "../lib/meta-pixel";

let lastTrackedUrl: string | null = null;

export function MetaPixel(): React.ReactElement | null {
  const pixelId = getMetaPixelId();
  const [ready, setReady] = useState(false);
  if (!pixelId) {
    return null;
  }

  return (
    <>
      <Script
        id="meta-pixel-init"
        strategy="afterInteractive"
        onReady={() => {
          setReady(true);
        }}
      >
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', ${JSON.stringify(pixelId)});
        `}
      </Script>
      <Suspense fallback={null}>
        <MetaPageViewTracker enabled={ready} />
      </Suspense>
    </>
  );
}

function MetaPageViewTracker({ enabled }: { enabled: boolean }): React.ReactElement | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const query = searchParams.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    if (lastTrackedUrl === nextUrl) {
      return;
    }

    lastTrackedUrl = nextUrl;
    trackPageView();
  }, [enabled, pathname, searchParams]);

  return null;
}
