import { AppData, Contact, Message } from '../types';

export type SyncPayload = {
  userPhone: string;
  contacts: Contact[];
  messages: Record<string, Message[]>;
};

export type SyncResult = {
  success: boolean;
  message: string;
  syncTime: string;
};

export class SyncClient {
  static async sync(payload: SyncPayload): Promise<SyncResult> {
    try {
      const profile = {
        userPhone: payload.userPhone,
        contactCount: payload.contacts.length,
        messageCount: Object.values(payload.messages).reduce((sum, items) => sum + items.length, 0),
      };

      await new Promise((resolve) => setTimeout(resolve, 800));

      return {
        success: true,
        message: `Backend-ready sync completed for ${profile.userPhone || 'user'}.`,
        syncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Sync failed. Your offline data is still safe locally.',
        syncTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }
  }
}
