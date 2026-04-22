import AuditPage from '@/components/auditdetails/Auditdetails'

export default function page({ params }: { params: Promise<{ id: string }> }) {
  return <AuditPage params={params} />
}