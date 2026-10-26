import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';
import { AppData, Contact, Message } from '../types';

const STORAGE_KEY = 'lumachat_secure_state_v1';
const STORAGE_KEY_MASTER = 'lumachat_master_key';

const defaultMessages: Record<string, Message[]> = {
  c1: [
    { id: 'm1', text: 'Welcome to LumaChat. Your local secure messages are ready.', sender: 'them', timestamp: Date.now() },
  ],
};

const defaultContacts: Contact[] = [
  { id: 'c1', name: 'Alicia', phone: '+14152037462', favorite: true },
  { id: 'c2', name: 'Nora', phone: '+442079460958', favorite: false },
  { id: 'c3', name: 'Milo', phone: '+610255501111', favorite: true },
];

export const defaultAppData: AppData = {
  userPhone: '',
  loggedIn: false,
  otpCode: '',
  contacts: defaultContacts,
  messages: defaultMessages,
  selectedContactId: 'c1',
};

async function ensureMasterKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(STORAGE_KEY_MASTER);
  if (existing) return existing;

  const generated = `lumachat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await SecureStore.setItemAsync(STORAGE_KEY_MASTER, generated);
  return generated;
}

export async function encryptPayload(raw: string): Promise<string> {
  const key = await ensureMasterKey();
  return CryptoJS.AES.encrypt(raw, key).toString();
}

export async function decryptPayload(encrypted: string): Promise<string> {
  const key = await ensureMasterKey();
  const bytes = CryptoJS.AES.decrypt(encrypted, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export async function saveAppData(data: AppData) {
  try {
    const payload = JSON.stringify(data);
    const encrypted = await encryptPayload(payload);
    await AsyncStorage.setItem(STORAGE_KEY, encrypted);
  } catch (error) {
    console.log('Failed to save app data', error);
  }
}

export async function loadAppData(): Promise<AppData> {
  try {
    const encrypted = await AsyncStorage.getItem(STORAGE_KEY);
    if (!encrypted) return defaultAppData;

    const decrypted = await decryptPayload(encrypted);
    if (!decrypted) return defaultAppData;

    const parsed = JSON.parse(decrypted) as AppData;

    return {
      ...defaultAppData,
      ...parsed,
      contacts: parsed.contacts?.length ? parsed.contacts : defaultContacts,
      messages: parsed.messages && Object.keys(parsed.messages).length ? parsed.messages : defaultMessages,
    };
  } catch (error) {
    console.log('Failed to load app data', error);
    return defaultAppData;
  }
}
