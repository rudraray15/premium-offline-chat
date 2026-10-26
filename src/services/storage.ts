import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export type PushRegistrationResult = {
  token: string;
  status: string;
};

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return {
      token: 'demo-push-token',
      status: 'Simulation mode: push notifications are available on a physical device.',
    };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return {
      token: 'permission-denied',
      status: 'Push permission was denied. You can enable it from settings later.',
    };
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  return {
    token,
    status: `Push notifications enabled: ${token.slice(0, 18)}...`,
  };
}
