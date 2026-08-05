import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthLogin from '../AuthLogin';

const baseProps = {
  email: '',
  password: '',
  onEmailChange: vi.fn(),
  onPasswordChange: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue(undefined),
};

describe('AuthLogin', () => {
  it('renders email input, password input, and Login button', () => {
    render(<AuthLogin {...baseProps} />);
    expect(document.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('calls onEmailChange with new value when user types in email field', async () => {
    const onEmailChange = vi.fn();
    render(<AuthLogin {...baseProps} onEmailChange={onEmailChange} />);
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    await userEvent.type(emailInput, 'a');
    expect(onEmailChange).toHaveBeenCalledWith('a');
  });

  it('calls onPasswordChange with new value when user types in password field', async () => {
    const onPasswordChange = vi.fn();
    render(<AuthLogin {...baseProps} onPasswordChange={onPasswordChange} />);
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    await userEvent.type(passwordInput, 'x');
    expect(onPasswordChange).toHaveBeenCalledWith('x');
  });

  it('calls onSubmit when form is submitted', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AuthLogin {...baseProps} email="user@example.com" password="password123" onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
