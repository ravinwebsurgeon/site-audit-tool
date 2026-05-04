import SiteAuditDetails from '@/components/site-audit/SiteAuditDetails';

export default function SiteAuditPage({ params }: { params: Promise<{ id: string }> }) {
  return <SiteAuditDetails params={params} />;
}
