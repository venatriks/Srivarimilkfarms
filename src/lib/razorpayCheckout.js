export function loadRazorpay() {
    return new Promise((resolve, reject) => {
        if (window.Razorpay) {
            resolve();
            return;
        }

        const existing = document.querySelector(
            'script[data-srivari-razorpay]'
        );

        if (existing) {
            existing.addEventListener('load', () => resolve(), {
                once: true
            });
            existing.addEventListener('error', () => reject(
                new Error('Unable to load Razorpay.')
            ), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.dataset.srivariRazorpay = 'true';

        script.onload = () => resolve();
        script.onerror = () => reject(
            new Error('Unable to load Razorpay.')
        );

        document.body.appendChild(script);
    });
}

export async function openSubscriptionRazorpay({
    order,
    customer,
    onPaymentSubmitted
}) {
    await loadRazorpay();

    return new Promise((resolve) => {
        const checkout = new window.Razorpay({
            key: order.key_id,
            order_id: order.order_id,
            amount: Number(order.amount_paise),
            currency: 'INR',
            name: 'Srivari Milk Farms',
            description: 'Prepaid Milk Subscription',
            prefill: {
                name: customer?.name || '',
                email: customer?.email || '',
                contact: customer?.phone || ''
            },
            theme: {
                color: '#0F3E2E'
            },
            handler: (response) => {
                onPaymentSubmitted?.(response);
                resolve({
                    submitted: true,
                    response
                });
            },
            modal: {
                ondismiss: () => resolve({
                    submitted: false
                })
            }
        });

        checkout.open();
    });
}