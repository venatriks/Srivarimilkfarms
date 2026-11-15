
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    }
);

function getTomorrowIST() {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());

    const values = Object.fromEntries(
        parts
            .filter(part =>
                ['year', 'month', 'day'].includes(part.type)
            )
            .map(part => [part.type, Number(part.value)])
    );

    return new Date(
        Date.UTC(
            values.year,
            values.month - 1,
            values.day + 1
        )
    ).toISOString().slice(0, 10);
}

exports.handler = async () => {
    const deliveryDate = getTomorrowIST();

    console.log(
        `Generating subscription deliveries for ${deliveryDate}`
    );

    const { data, error } = await supabase.rpc(
        'generate_subscription_deliveries',
        {
            p_delivery_date: deliveryDate,
            p_subscription_id: null
        }
    );

    if (error) {
        console.error(
            'Subscription delivery generation failed:',
            {
                code: error.code,
                message: error.message
            }
        );

        throw new Error(
            'Subscription delivery generation failed'
        );
    }

    if (!Number.isInteger(data) || data < 0) {
        throw new Error(
            'Invalid delivery generation result'
        );
    }

    const result = {
        success: true,
        deliveryDate,
        generatedCount: data
    };

    console.log(JSON.stringify(result));

    return {
        statusCode: 200,
        body: JSON.stringify(result)
    };
};
