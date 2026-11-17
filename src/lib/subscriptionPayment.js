import { API_BASE_URL } from './apiConfig';
import { supabase } from './supabase';


const PAYMENT_API =
    `${API_BASE_URL}/payments/subscription/create-order`;

const PAYMENT_ATTEMPT_PREFIX =
    'srivari_subscription_payment_';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function getPaymentStorageKey(subscriptionId, deliveryDate) {
    return deliveryDate
        ? `${PAYMENT_ATTEMPT_PREFIX}${subscriptionId}_${deliveryDate}`
        : `${PAYMENT_ATTEMPT_PREFIX}${subscriptionId}`;
}

export async function createSubscriptionPaymentOrder(
    subscriptionId,
    deliveryDate = null
) {

    if (!subscriptionId) {
        throw new Error('Subscription ID is required.');
    }

    if (
        deliveryDate !== null &&
        (
            typeof deliveryDate !== 'string' ||
            !DATE_PATTERN.test(deliveryDate)
        )
    ) {
        throw new Error(
            'Delivery date must be in YYYY-MM-DD format.'
        );
    }

    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session?.access_token) {
        throw new Error('Please sign in to continue payment.');
    }

    const storageKey = getPaymentStorageKey(
        subscriptionId,
        deliveryDate
    );

    let idempotencyKey = sessionStorage.getItem(storageKey);

    if (!idempotencyKey) {
        idempotencyKey = crypto.randomUUID();
        sessionStorage.setItem(storageKey, idempotencyKey);
    }

    const payload = {
        subscription_id: subscriptionId,
        idempotency_key: idempotencyKey
    };

    if (deliveryDate !== null) {
        payload.delivery_date = deliveryDate;
    }

    const response = await fetch(PAYMENT_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.session.access_token}`
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(
            result?.error ||
            'Unable to initiate subscription payment.'
        );
    }

    if (
        !result?.key_id ||
        !result?.order_id ||
        !Number.isSafeInteger(Number(result.amount_paise)) ||
        Number(result.amount_paise) <= 0 ||
        result.currency !== 'INR'
    ) {
        throw new Error('Invalid payment order response.');
    }

    return result;
}

export function clearSubscriptionPaymentAttempt(
    subscriptionId,
    deliveryDate = null
) {
    sessionStorage.removeItem(
        getPaymentStorageKey(subscriptionId, deliveryDate)
    );
}
