import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SettingsScreen } from '../../src/screens/SettingsScreen';

jest.mock('../../src/services/storage', () => ({
  DEFAULT_LOOKUP_PREFERENCES: { language: 'auto', labelStyle: 'generic' },
  loadCredentials: jest.fn().mockResolvedValue(null),
  loadSelectedList: jest.fn().mockResolvedValue(null),
  loadCustomBarcodes: jest.fn().mockResolvedValue([]),
  loadLookupPreferences: jest.fn().mockResolvedValue({ language: 'auto', labelStyle: 'generic' }),
  saveCredentials: jest.fn(),
  saveSelectedList: jest.fn(),
  saveCustomBarcodes: jest.fn(),
  saveLookupPreferences: jest.fn(),
}));

describe('custom barcode settings', () => {
  it('opens the editor in a modal instead of rendering it inline', async () => {
    const screen = await render(<SettingsScreen />);

    await waitFor(() => expect(screen.getByText('Custom Barcodes')).toBeTruthy());
    expect(screen.queryByText('Save Custom Barcode')).toBeNull();

    await fireEvent.press(screen.getByText('Custom Barcodes'));

    expect(screen.getByText('Save Custom Barcode')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));

    expect(screen.queryByText('Save Custom Barcode')).toBeNull();
  });
});
