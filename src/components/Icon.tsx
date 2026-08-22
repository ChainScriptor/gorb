// An icon is either a sprite symbol id ("ic-...") or an image URL.
export default function Icon({ icon, className = 'ico' }: { icon: string; className?: string }) {
  if (icon.startsWith('ic-')) {
    return (
      <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
        <use href={'#' + icon} />
      </svg>
    )
  }
  return <img className={className} src={icon} alt="" />
}
