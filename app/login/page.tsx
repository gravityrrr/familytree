import { LoginForm } from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In – Family Tree',
  description: 'Sign in to your family tree account.',
};

export default function LoginPage() {
  return <LoginForm />;
}
