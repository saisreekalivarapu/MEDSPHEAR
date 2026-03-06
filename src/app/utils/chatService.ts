import { ChatMessage } from '../types';

const STORAGE_KEY_MESSAGES = 'medspear_chat_messages';

// Simple pub/sub for real-time updates within the same window instance
type Listener = (messages: ChatMessage[]) => void;
let listeners: Listener[] = [];

export const chatService = {
    getMessages(patientId: string): ChatMessage[] {
        const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
        const messages: ChatMessage[] = stored ? JSON.parse(stored) : [];
        return messages.filter(m => m.patientId === patientId);
    },

    getAllMessages(): ChatMessage[] {
        const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
        return stored ? JSON.parse(stored) : [];
    },

    sendMessage(patientId: string, text: string, sender: 'system' | 'doctor' | 'patient', doctorId?: string): ChatMessage {
        const stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
        const messages: ChatMessage[] = stored ? JSON.parse(stored) : [];

        const newMessage: ChatMessage = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            patientId,
            doctorId,
            text,
            sender,
            timestamp: new Date().toISOString(),
        };

        messages.push(newMessage);
        localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));

        // Notify all listeners
        this.notify();

        return newMessage;
    },

    subscribe(listener: Listener) {
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    },

    notify() {
        const messages = this.getAllMessages();
        listeners.forEach(l => l(messages));
    }
};
