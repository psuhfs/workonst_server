/// TODO: drop this file entirely.


const WEBHOOK_URL = process.env.WEBHOOK;

if (!WEBHOOK_URL) {
    throw new Error("WEBHOOK is not defined in the environment variables.");
}

const WEBHOOK: string = WEBHOOK_URL;

async function notify(message: string): Promise<void> {
    try {
        const response = await fetch(WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: message,
                username: "Bun from Stacks",
                avatar_url: "https://www.bun.co.th/uploads/logo/bun.png",
            }),
        });

        if (!response.ok) {
            console.error('Failed to send message to Discord webhook:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error sending message to Discord webhook:', error);
    }
}

export async function log(message: string): Promise<void> {
    console.log(message);
    await notify(message); // Ensure async operation is awaited
}

export async function logError(error: string): Promise<void> {
    console.error(error);
    await notify(`**Error:** ${error}`); // Highlight errors in Discord
}
