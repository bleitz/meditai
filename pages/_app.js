// 1. import `NextUIProvider` component
import { NextUIProvider } from '@nextui-org/react';
import { useEffect } from 'react'

import { useRouter } from 'next/router'

import * as gtag from '../lib/gtag.js'

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
    // 2. Use at the root of your app
    <NextUIProvider>

      <Component {...pageProps} />
    </NextUIProvider>
  );
}

export default MyApp;
