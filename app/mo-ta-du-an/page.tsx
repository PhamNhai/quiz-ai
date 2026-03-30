import { unstable_noStore as noStore } from 'next/cache'
import { getMoTaDuAnPayload } from '@/lib/mo-ta-du-an-data'
import MoTaDuAnView from './MoTaDuAnView'

export const dynamic = 'force-dynamic'

export default async function MoTaDuAnPage() {
  noStore()
  const data = await getMoTaDuAnPayload()
  return <MoTaDuAnView data={data} />
}
