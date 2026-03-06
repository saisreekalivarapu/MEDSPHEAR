import { toast } from 'sonner';

/**
 * Simulates sending an SMS notification to a patient.
 * In a real-world scenario, this would call an external API like Twilio.
 */
export const sendSMS = (phoneNumber: string, message: string) => {
    console.log(`[SMS] Sending to ${phoneNumber}: ${message}`);

    // Show a toast notification to simulate the SMS being sent/received
    toast.info('Mobile Notification Sent', {
        description: `To: ${phoneNumber} - "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
        position: 'bottom-right',
        duration: 5000,
    });
};

export const smsTemplates = {
    registration: (name: string, position: number) =>
        `Hi ${name}, your registration at Medspear is successful. You are #${position} in the queue. We will notify you once the doctor is ready.`,

    consultationStart: (name: string) =>
        `Hi ${name}, the doctor is ready for your consultation. Please proceed to the clinic room immediately.`,

    consultationComplete: (name: string) =>
        `Thank you for visiting Medspear, ${name}. Your consultation is complete. Get well soon!`,

    doctorAvailable: (name: string, waitTime: number) =>
        `Great news ${name}! A doctor is now available. Your expected wait time is approximately ${waitTime} minutes.`
};
