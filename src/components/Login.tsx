import { asset } from '../data/apps'

interface Props {
  scanlines: boolean
  onToggleScan: () => void
  onEnter: () => void
}

export default function Login({ scanlines, onToggleScan, onEnter }: Props) {
  return (
    <>
      <section className="login is-on" id="login">
        <div className="login__bar login__bar--top" />
        <div className="login__body">
          <div className="login__left">
            <img className="login__mark" src={'/4444.png'} alt="" />
            <p className="login__brand"><small>Ultra rare</small>Gorb<span>OS</span></p>
            <p className="login__edition">Original Edition</p>
            <p className="login__prompt">To begin, select user</p>
          </div>
          <div className="login__rule" />
          <div className="login__right">
            <button className="user user--disabled" type="button" id="userWallet">
              <span className="user__pic user__pic--wallet">◎</span>
              <span className="user__meta"><b>Wallet Account</b><i>Connect a Solana wallet — coming soon</i></span>
            </button>
            <button className="user" type="button" id="userGuest" onClick={onEnter}>
              <span className="user__pic"><img src={'/4444.png'} alt="" /></span>
              <span className="user__meta"><b>Guest</b><i>Enter without connecting a wallet</i></span>
              <span className="user__go">➜</span>
            </button>
          </div>
        </div>
        <div className="login__bar login__bar--bottom">
          <button className="login__toggle" id="scanToggle" type="button" onClick={onToggleScan}>
            <i>◉</i> Toggle scanlines effect
          </button>
          <p>After logging in you can open anything from the <b>start</b> button,
             or by double-clicking an icon on the desktop.</p>
        </div>
      </section>
      <div className={'scanlines' + (scanlines ? ' is-on' : '')} id="scanlines" aria-hidden="true" />
    </>
  )
}
