import { ApiService, type PublicDeliveryRate } from '@/lib/api/generated';

/** Walk every page of public delivery rates (API default page size is 25). */
export async function fetchAllPublicDeliveryRates(): Promise<PublicDeliveryRate[]> {
  const collected: PublicDeliveryRate[] = [];
  let page = 1;
  while (page <= 50) {
    const data = await ApiService.apiV1PublicDeliveryRatesList(page);
    collected.push(...(data.results ?? []));
    if (!data.next) break;
    page += 1;
  }
  return collected;
}
