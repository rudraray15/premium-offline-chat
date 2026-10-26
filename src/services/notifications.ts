export type MessageSender = 'me' | 'them';

export type Message = {
  id: string;
  text: string;
  sender: MessageSender;
  timestamp: number;
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
  favorite: boolean;
};

export type AppData = {
  userPhone: string;
  loggedIn: boolean;
  otpCode: string;
  contacts: Contact[];
  messages: Record<string, Message[]>;
  selectedContactId: string;
};
