import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { loadAppData, saveAppData } from './src/services/storage';
import { registerForPushNotifications } from './src/services/notifications';
import { SyncClient } from './src/services/sync';
import { AppData, Contact, Message } from './src/types';

const initialMessages: Record<string, Message[]> = {
  c1: [
    { id: 'm1', text: 'Hey! I have the final brief ready.', sender: 'them', timestamp: Date.now() - 1000 * 60 * 20 },
    { id: 'm2', text: 'Perfect. I will review it offline.', sender: 'me', timestamp: Date.now() - 1000 * 60 * 12 },
  ],
  c2: [
    { id: 'm3', text: 'The package is ready for dispatch.', sender: 'them', timestamp: Date.now() - 1000 * 60 * 60 * 3 },
  ],
  c3: [
    { id: 'm4', text: 'Let me know when the review is done.', sender: 'them', timestamp: Date.now() - 1000 * 60 * 90 },
  ],
};

const initialData: AppData = {
  userPhone: '',
  loggedIn: false,
  otpCode: '',
  contacts: [
    { id: 'c1', name: 'Alicia', phone: '+14152037462', favorite: true },
    { id: 'c2', name: 'Nora', phone: '+442079460958', favorite: false },
    { id: 'c3', name: 'Milo', phone: '+610255501111', favorite: true },
  ],
  messages: initialMessages,
  selectedContactId: 'c1',
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [appData, setAppData] = useState<AppData>(initialData);
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [draft, setDraft] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [syncStatus, setSyncStatus] = useState('Ready for sync');
  const [pushStatus, setPushStatus] = useState('Push notifications not enabled');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const loaded = await loadAppData();
      setAppData(loaded);
      setPhoneInput(loaded.userPhone || '');
      setIsReady(true);
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    saveAppData(appData);
  }, [appData, isReady]);

  const selectedContact = useMemo(
    () => appData.contacts.find((contact) => contact.id === appData.selectedContactId) || appData.contacts[0] || null,
    [appData.contacts, appData.selectedContactId],
  );

  const selectedMessages = useMemo(
    () => (selectedContact ? appData.messages[selectedContact.id] || [] : []),
    [appData.messages, selectedContact],
  );

  const requestOtp = () => {
    const normalized = phoneInput.replace(/\D/g, '');
    if (!normalized) {
      Alert.alert('Phone missing', 'Please enter a valid phone number.');
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    Alert.alert('Demo OTP', `Use code: ${code}`);
  };

  const login = () => {
    const normalized = phoneInput.replace(/\D/g, '');
    if (!normalized) {
      Alert.alert('Phone missing', 'Please enter a valid phone number.');
      return;
    }

    if (!generatedOtp || otpInput.trim() !== generatedOtp) {
      Alert.alert('OTP error', 'The code you entered is incorrect or expired.');
      return;
    }

    const validPhone = `+${normalized}`;
    setAppData((prev) => ({
      ...prev,
      userPhone: validPhone,
      loggedIn: true,
      otpCode: generatedOtp,
    }));
    setPhoneInput(validPhone);
  };

  const addContact = () => {
    const cleanName = newContactName.trim();
    const cleanPhone = newContactPhone.replace(/\D/g, '');

    if (!cleanName || !cleanPhone) {
      Alert.alert('Contact error', 'Please enter both a name and phone number.');
      return;
    }

    const newContact: Contact = {
      id: createId('contact'),
      name: cleanName,
      phone: `+${cleanPhone}`,
      favorite: false,
    };

    setAppData((prev) => ({
      ...prev,
      contacts: [newContact, ...prev.contacts],
      messages: {
        ...prev.messages,
        [newContact.id]: [{ id: createId('welcome'), text: 'New contact added to secure offline chats.', sender: 'them', timestamp: Date.now() }],
      },
      selectedContactId: newContact.id,
    }));

    setNewContactName('');
    setNewContactPhone('');
  };

  const sendMessage = () => {
    if (!selectedContact) return;
    const cleaned = draft.trim();
    if (!cleaned) return;

    const newMessage: Message = {
      id: createId('msg'),
      text: cleaned,
      sender: 'me',
      timestamp: Date.now(),
    };

    setAppData((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [selectedContact.id]: [...(prev.messages[selectedContact.id] || []), newMessage],
      },
    }));

    setDraft('');

    setTimeout(() => {
      const reply: Message = {
        id: createId('reply'),
        text: 'Secure offline sync received.',
        sender: 'them',
        timestamp: Date.now(),
      };

      setAppData((prev) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [selectedContact.id]: [...(prev.messages[selectedContact.id] || []), reply],
        },
      }));
    }, 1100);
  };

  const handleSync = async () => {
    setSyncStatus('Syncing...');
    const response = await SyncClient.sync({
      userPhone: appData.userPhone,
      contacts: appData.contacts,
      messages: appData.messages,
    });

    setSyncStatus(response.success ? `Synced at ${response.syncTime}` : response.message);
  };

  const handlePushRegister = async () => {
    const result = await registerForPushNotifications();
    setPushStatus(result.status);
  };

  const logout = () => {
    setAppData((prev) => ({
      ...prev,
      loggedIn: false,
      otpCode: '',
      userPhone: '',
    }));
    setPhoneInput('');
    setOtpInput('');
    setGeneratedOtp('');
  };

  if (!isReady) {
    return (
      <LinearGradient colors={['#040918', '#111827', '#0f172a']} style={styles.root}>
        <ExpoStatusBar style="light" />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingView}>
            <Text style={styles.loadingText}>Loading LumaChat...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!appData.loggedIn) {
    return (
      <LinearGradient colors={['#040918', '#111827', '#0f172a']} style={styles.root}>
        <ExpoStatusBar style="light" />
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.authWrapper}
          >
            <View style={styles.authCard}>
              <Text style={styles.brand}>LumaChat</Text>
              <Text style={styles.title}>Premium secure login</Text>
              <Text style={styles.subtitle}>Offline-first messaging with phone validation and secure local storage.</Text>

              <Text style={styles.label}>Phone number</Text>
              <TextInput
                value={phoneInput}
                onChangeText={setPhoneInput}
                placeholder="+14151234567"
                keyboardType="phone-pad"
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />

              <View style={styles.rowButtons}>
                <Pressable style={styles.secondaryButton} onPress={requestOtp}>
                  <Text style={styles.secondaryButtonText}>Request OTP</Text>
                </Pressable>
              </View>

              <Text style={styles.label}>OTP</Text>
              <TextInput
                value={otpInput}
                onChangeText={setOtpInput}
                placeholder="Enter 6-digit code"
                keyboardType="number-pad"
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />

              {generatedOtp ? (
                <View style={styles.demoBox}>
                  <Text style={styles.demoLabel}>Demo OTP</Text>
                  <Text style={styles.demoCode}>{generatedOtp}</Text>
                </View>
              ) : null}

              <Pressable style={styles.primaryButton} onPress={login}>
                <Text style={styles.primaryButtonText}>Verify & Continue</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#040918', '#111827', '#0f172a']} style={styles.root}>
      <ExpoStatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>Connected account</Text>
              <Text style={styles.headerPhone}>{appData.userPhone}</Text>
            </View>

            <Pressable style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>

          <View style={styles.statusRow}>
            <Pressable style={styles.syncButton} onPress={handleSync}>
              <Text style={styles.syncButtonText}>Sync</Text>
            </Pressable>
            <Pressable style={styles.notifyButton} onPress={handlePushRegister}>
              <Text style={styles.notifyButtonText}>Push</Text>
            </Pressable>
          </View>

          <Text style={styles.syncText}>{syncStatus}</Text>
          <Text style={styles.pushText}>{pushStatus}</Text>

          <View style={styles.contactsPanel}>
            <Text style={styles.panelTitle}>Contacts</Text>
            <View style={styles.contactForm}>
              <TextInput
                value={newContactName}
                onChangeText={setNewContactName}
                placeholder="Name"
                placeholderTextColor="#94a3b8"
                style={styles.smallInput}
              />
              <TextInput
                value={newContactPhone}
                onChangeText={setNewContactPhone}
                placeholder="Phone"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                style={styles.smallInput}
              />
              <Pressable style={styles.addButton} onPress={addContact}>
                <Text style={styles.addButtonText}>Add</Text>
              </Pressable>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={appData.contacts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.contactList}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedContact?.id;
                return (
                  <Pressable
                    style={[styles.contactCard, isSelected && styles.contactCardSelected]}
                    onPress={() => setAppData((prev) => ({ ...prev, selectedContactId: item.id }))}
                  >
                    <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text></View>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactPhone}>{item.phone}</Text>
                  </Pressable>
                );
              }}
            />
          </View>

          <View style={styles.chatPanel}>
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <View style={styles.chatAvatar}>
                  <Text style={styles.chatAvatarText}>{selectedContact?.name.charAt(0).toUpperCase() || 'C'}</Text>
                </View>
                <View>
                  <Text style={styles.chatName}>{selectedContact?.name || 'Select contact'}</Text>
                  <Text style={styles.chatMeta}>{selectedContact?.phone || 'No contact selected'}</Text>
                </View>
              </View>
              <View style={styles.onlineDotWrap}><View style={styles.onlineDot} /></View>
            </View>

            <FlatList
              data={selectedMessages}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messageListContent}
              renderItem={({ item }) => {
                const isMine = item.sender === 'me';
                return (
                  <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowThem]}>
                    <View style={[styles.messageBubble, isMine ? styles.messageBubbleMine : styles.messageBubbleThem]}>
                      <Text style={[styles.messageText, isMine ? styles.messageTextMine : styles.messageTextThem]}>{item.text}</Text>
                      <Text style={[styles.messageTime, isMine ? styles.messageTimeMine : styles.messageTimeThem]}>{formatTime(item.timestamp)}</Text>
                    </View>
                  </View>
                );
              }}
            />

            <View style={styles.inputContainer}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Type a private message..."
                placeholderTextColor="#94a3b8"
                style={styles.chatInput}
              />
              <Pressable style={styles.sendButton} onPress={sendMessage}>
                <Text style={styles.sendButtonText}>Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
  },
  authWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  authCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    padding: 22,
  },
  brand: {
    color: '#a78bfa',
    fontWeight: '800',
    letterSpacing: 1.2,
    fontSize: 18,
    marginBottom: 12,
  },
  title: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 28,
    marginBottom: 6,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  label: {
    color: '#dbeafe',
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    marginBottom: 14,
  },
  rowButtons: {
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  secondaryButtonText: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  demoBox: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
  },
  demoLabel: {
    color: '#ddd6fe',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  demoCode: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLabel: {
    color: '#94a3b8',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerPhone: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 18,
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  syncButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  notifyButton: {
    backgroundColor: '#0f766e',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  notifyButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  syncText: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 4,
  },
  pushText: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 12,
  },
  contactsPanel: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    padding: 14,
    marginBottom: 14,
  },
  panelTitle: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 8,
  },
  contactForm: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  smallInput: {
    flex: 1,
    minWidth: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
  },
  addButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  contactList: {
    paddingVertical: 4,
  },
  contactCard: {
    width: 138,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  contactCardSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139,92,246,0.12)',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
  },
  contactName: {
    color: '#f8fafc',
    fontWeight: '700',
    marginBottom: 2,
  },
  contactPhone: {
    color: '#94a3b8',
    fontSize: 11,
  },
  chatPanel: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    padding: 14,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.12)',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  chatAvatarText: {
    color: '#fff',
    fontWeight: '800',
  },
  chatName: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  chatMeta: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  onlineDotWrap: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#34d399',
  },
  messagesList: {
    flex: 1,
    marginTop: 10,
  },
  messageListContent: {
    paddingVertical: 8,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  messageRowMine: {
    justifyContent: 'flex-end',
  },
  messageRowThem: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleMine: {
    backgroundColor: '#8b5cf6',
    borderBottomRightRadius: 6,
  },
  messageBubbleThem: {
    backgroundColor: 'rgba(148,163,184,0.12)',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#fff',
  },
  messageTextThem: {
    color: '#f8fafc',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 5,
  },
  messageTimeMine: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  messageTimeThem: {
    color: '#94a3b8',
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148,163,184,0.12)',
    paddingTop: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
