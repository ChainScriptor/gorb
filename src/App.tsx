import { useEffect, useState } from 'react'
import { SPRITE } from './data/sprite'
import { WMProvider } from './wm'
import { useIsMobile } from './hooks/useIsMobile'
import Login from './components/Login'
import Desktop from './components/Desktop'
import MobileShell from './components/MobileShell'
import WalletContextProvider from './wallet/WalletContextProvider'
import { playClip } from './sfx'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [scanlines, setScanlines] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    // the original clears the boot class once the shell is up
    document.body.classList.remove('booting')
  }, [])

  return (
    <>
      {/* icon sprite, referenced by <use href="#ic-..."> everywhere */}
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
           dangerouslySetInnerHTML={{ __html: SPRITE }} />

      {!loggedIn ? (
        <Login
          scanlines={scanlines}
          onToggleScan={() => setScanlines((s) => !s)}
          /* Fired from the login click itself, so the browser counts it
             as user activation and never blocks the playback. */
          onEnter={() => {
            playClip('/open.mp3')
            setLoggedIn(true)
          }}
        />
      ) : (
        <WalletContextProvider>
          <WMProvider>
            {isMobile ? (
              <MobileShell scanlines={scanlines} onToggleScan={() => setScanlines((s) => !s)} />
            ) : (
              <Desktop scanlines={scanlines} onToggleScan={() => setScanlines((s) => !s)} />
            )}
          </WMProvider>
        </WalletContextProvider>
      )}
    </>
  )
}
