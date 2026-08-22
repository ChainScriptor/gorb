import { useEffect, useState } from 'react'
import { SPRITE } from './data/sprite'
import { WMProvider } from './wm'
import Login from './components/Login'
import Desktop from './components/Desktop'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [scanlines, setScanlines] = useState(false)

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
          onEnter={() => setLoggedIn(true)}
        />
      ) : (
        <WMProvider>
          <Desktop scanlines={scanlines} onToggleScan={() => setScanlines((s) => !s)} />
        </WMProvider>
      )}
    </>
  )
}
