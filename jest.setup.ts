process.env.EXPO_PUBLIC_BRING_API_KEY = 'test-only-key';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
