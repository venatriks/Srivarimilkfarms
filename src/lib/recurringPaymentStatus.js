import { API_BASE_URL } from './apiConfig';
import { supabase } from './supabase';


export async function getRecurringPaymentStatus(subscriptionId) {

  const { data, error } = await supabase.auth.getSession();

  if (error || !data?.session?.access_token) {
    throw new Error('Please sign in to check payment status.');
  }

  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}/payments/subscription/status?subscription_id=` +
      encodeURIComponent(subscriptionId),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${data.session.access_token}`
      }
    }
  );

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.error || 'Unable to retrieve payment status.'
    );
  }

  if (!result?.recurring) {
    throw new Error(
      'Recurring payment status is not available from this API.'
    );
  }

  return result;
}
