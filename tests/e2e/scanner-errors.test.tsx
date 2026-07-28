import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { fireEvent, render } from '@testing-library/react-native';
import { ScannerScreen } from '../../src/screens/ScannerScreen';
import { saveSelectedList } from '../../src/services/storage';

jest.mock('expo-camera', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    CameraView: ({ onBarcodeScanned }: { onBarcodeScanned?: (result: object) => void }) =>
      React.createElement(
        Pressable,
        {
          accessibilityLabel: 'Test camera',
          onPress: () =>
            onBarcodeScanned?.({
              data: '7611111111111',
              type: 'ean13',
              bounds: { origin: { x: 135, y: 195 }, size: { width: 80, height: 40 } },
              cornerPoints: [],
            }),
        },
        React.createElement(Text, null, 'Camera preview'),
      ),
    useCameraPermissions: () => [{ granted: true }, jest.fn()],
  };
});

jest.mock('@react-navigation/native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    useFocusEffect: (callback: () => void | (() => void)) => React.useEffect(callback, [callback]),
  };
});

function apiResponse(options: { ok: boolean; status: number; body?: unknown }) {
  return {
    ok: options.ok,
    status: options.status,
    json: async () => options.body ?? {},
  } as Response;
}

async function renderConfiguredScanner() {
  jest
    .mocked(SecureStore.getItemAsync)
    .mockResolvedValue(JSON.stringify({ email: 'pilot@moon.example', password: 'lunar-secret' }));
  await saveSelectedList({ listUuid: 'weekend-list', name: 'Weekend Supplies' });
  return render(<ScannerScreen />);
}

async function scanBarcode(screen: Awaited<ReturnType<typeof render>>) {
  await fireEvent.press(screen.getByLabelText('Test camera'));
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('scanner lookup failures', () => {
  it('shows a not-found message when no database contains the barcode', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(apiResponse({ ok: false, status: 404 }));
    const screen = await renderConfiguredScanner();

    await scanBarcode(screen);

    expect(
      await screen.findByText(
        'Product not found. Add a custom label in Settings and scan again.',
        undefined,
        { timeout: 2000 },
      ),
    ).toBeTruthy();
  });

  it.each([
    ['database HTTP error', () => Promise.resolve(apiResponse({ ok: false, status: 503 }))],
    ['database network error', () => Promise.reject(new Error('offline'))],
  ])('shows a lookup error for a %s', async (_name, response) => {
    jest.spyOn(global, 'fetch').mockImplementationOnce(response);
    const screen = await renderConfiguredScanner();

    await scanBarcode(screen);

    expect(
      await screen.findByText('Product lookup failed.', undefined, { timeout: 2000 }),
    ).toBeTruthy();
  });
});
