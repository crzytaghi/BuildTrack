import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock fetch so bootstrap doesn't make real HTTP calls
global.fetch = jest.fn(() =>
  Promise.resolve({ ok: false } as Response)
);

const TestConsumer = () => {
  const { token, user, booting, handleLogout } = useAuth();
  if (booting) return <Text testID="booting">Booting</Text>;
  return (
    <>
      <Text testID="token">{token ?? 'no-token'}</Text>
      <Text testID="user">{user?.email ?? 'no-user'}</Text>
      <TouchableOpacity testID="logout" onPress={handleLogout}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </>
  );
};

describe('AuthContext', () => {
  it('renders without crashing inside AuthProvider', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => expect(getByTestId('token')).toBeTruthy());
    expect(getByTestId('token').props.children).toBe('no-token');
  });

  it('starts with no token when AsyncStorage is empty', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => getByTestId('token'));
    expect(getByTestId('token').props.children).toBe('no-token');
    expect(getByTestId('user').props.children).toBe('no-user');
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used inside AuthProvider'
    );
    consoleSpy.mockRestore();
  });

  it('handleLogout is a function', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => getByTestId('logout'));
    // Should not throw when pressed
    await act(async () => {
      fireEvent.press(getByTestId('logout'));
    });
  });
});
