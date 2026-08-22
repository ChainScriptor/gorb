import { useEffect, useState } from 'react'

// True on narrow / phone-sized viewports. Updates live on resize/rotate.
export function useIsMobile(breakpoint = 768) {
  const query = `(max-width:${breakpoint - 1}px)`
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMobile(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])

  return mobile
}
