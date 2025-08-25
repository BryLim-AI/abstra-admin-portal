export function getStatusColor(status: string = ''): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'terminated':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function formatAddress(unit: {
  street?: string;
  brgy_district?: string;
  city?: string;
}): string {
  const { street, brgy_district, city } = unit || {};
  const parts = [street, brgy_district, city].filter(Boolean);
  return parts.join(', ');
}
