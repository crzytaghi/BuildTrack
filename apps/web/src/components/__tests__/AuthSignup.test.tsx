import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthSignup from '../AuthSignup';

const baseProps = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  companyName: '',
  address: '',
  phone: '',
  onNameChange: vi.fn(),
  onEmailChange: vi.fn(),
  onPasswordChange: vi.fn(),
  onConfirmPasswordChange: vi.fn(),
  onCompanyNameChange: vi.fn(),
  onAddressChange: vi.fn(),
  onPhoneChange: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue(undefined),
};

describe('AuthSignup', () => {
  it('renders all 7 fields', () => {
    render(<AuthSignup {...baseProps} />);
    expect(document.querySelectorAll('input')).toHaveLength(7);
  });

  it('shows password validation checklist when password field is non-empty', () => {
    render(<AuthSignup {...baseProps} password="A" />);
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('One number')).toBeInTheDocument();
    expect(screen.getByText(/one special character/i)).toBeInTheDocument();
  });

  it('validation checklist shows green checkmark for satisfied rules', () => {
    render(<AuthSignup {...baseProps} password="Abc123!x" />);
    const items = screen.getAllByRole('listitem');
    items.forEach((item) => {
      expect(item.className).toContain('emerald');
    });
  });

  it('submit button is disabled when password does not meet requirements', () => {
    render(<AuthSignup {...baseProps} password="short" confirmPassword="short" />);
    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled();
  });

  it('submit button is disabled when passwords do not match', () => {
    render(<AuthSignup {...baseProps} password="ValidPass1!" confirmPassword="Different1!" />);
    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled();
  });

  it('submit button enabled when password valid and passwords match', () => {
    render(<AuthSignup {...baseProps} password="ValidPass1!" confirmPassword="ValidPass1!" />);
    expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
  });
});
