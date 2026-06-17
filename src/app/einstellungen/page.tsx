import { getSettings } from '@/lib/data'
import { PageHeader } from '@/components/ui'
import { HouseholdForm } from './HouseholdForm'

export const dynamic = 'force-dynamic'

export default async function EinstellungenPage() {
  const { householdSize } = await getSettings()

  return (
    <div>
      <PageHeader title="Einstellungen" subtitle="Haushalt und Reichweite." />
      <div className="card p-5">
        <HouseholdForm householdSize={householdSize} />
      </div>
    </div>
  )
}
