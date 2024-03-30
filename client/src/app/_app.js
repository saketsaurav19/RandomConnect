import React from 'react';
import { SocketProvider } from './hook/page';
import '../styles/globals.css'

function MyApp({Component, pageProps, socket}) {
  return (
    <SocketProvider>
      <Component {...pageProps} />
    </SocketProvider>
  )
}

export default MyApp