// 1. import `NextUIProvider` component
import { NextUIProvider } from '@nextui-org/react';
import { useEffect } from 'react'

import { useRouter } from 'next/router'

import * as gtag from '../lib/gtag.js'
import Script from 'next/script';

function MyApp({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    const handleRouteChange = (url) => {
      gtag.pageview(url)
    }
    //When the component is mounted, subscribe to router changes
    //and log those page views
    router.events.on('routeChangeComplete', handleRouteChange)

    // If the component is unmounted, unsubscribe
    // from the event with the `off` method
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])


  return (
    <>

      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`} strategy="afterInteractive"/>
      <Script strategy="lazyOnload">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                    });
                `}
      </Script>
    
      <NextUIProvider>

        <Component {...pageProps} />
      </NextUIProvider>
    </>
  );
}

export default MyApp;
