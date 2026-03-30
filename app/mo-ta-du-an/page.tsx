import { getMoTaDuAnPayload } from '@/lib/mo-ta-du-an-data'
import MoTaDuAnView from './MoTaDuAnView'

export const dynamic = 'force-dynamic'

export default async function MoTaDuAnPage() {
  const data = await getMoTaDuAnPayload()
  return <MoTaDuAnView data={data} />
}
