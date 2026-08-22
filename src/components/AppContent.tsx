import type { AppId } from '../data/apps'
import StaticApp from './StaticApp'
import Canal88 from './Canal88'
import Chart from './Chart'
import Memes from './Memes'
import Viewer from './Viewer'
import Gallery from './Gallery'
import Chat from './Chat'
import Terminal from './Terminal'
import Paint from './Paint'
import Shop from './Shop'

// Apps whose content is fully contained in the original <template> markup.
const STATIC: AppId[] = ['explorer', 'tokenomics', 'buy', 'lore', 'safety', 'bin', 'board', 'contract']

export default function AppContent({ app, payload }: { app: AppId; payload?: unknown; winKey?: number }) {
  switch (app) {
    case 'canal88': return <Canal88 />
    case 'chart': return <Chart />
    case 'memes': return <Memes />
    case 'viewer': return <Viewer payload={payload} />
    case 'gallery': return <Gallery />
    case 'chat': return <Chat />
    case 'terminal': return <Terminal />
    case 'paint': return <Paint />
    case 'shop': return <Shop />
    default:
      if (STATIC.includes(app)) return <StaticApp app={app} />
      return <StaticApp app={app} />
  }
}
