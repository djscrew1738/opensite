/**
 * LoginForm - Complete login form component
 * @module components/auth/LoginForm
 */

import { memo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthCard, AuthInput, PasswordInput, AuthButton, AuthSecondaryButton } from './';
import { AuthDivider, AuthFooter } from './AuthLayout';
import { useLoginForm, useGuestLogin } from './useAuthForm';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { colors } from '../../styles/tokens';

/**
 * Login form component
 */
export const LoginForm = memo(function LoginForm() {
  const { login } = useAuth();
  const { success: showToastSuccess, error: showToastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';
  
  const handleLoginSubmit = useCallback(async (email, password) => {
    const result = await login(email, password);
    showToastSuccess('Welcome back!');
    navigate(from, { replace: true });
    return result;
  }, [login, navigate, from, showToastSuccess]);
  
  const {
    email,
    password,
    errors,
    isSubmitting,
    isLocked,
    lockRemaining,
    emailInputRef,
    setEmail,
    setPassword,
    handleSubmit,
  } = useLoginForm({ onSubmit: handleLoginSubmit });
  
  const handleGuestSubmit = useCallback(async (email, password) => {
    const result = await login(email, password);
    showToastSuccess('Logged in as Guest!');
    navigate(from, { replace: true });
    return result;
  }, [login, navigate, from, showToastSuccess]);
  
  const { isSubmitting: isGuestSubmitting, handleGuestLogin } = useGuestLogin({
    onSubmit: handleGuestSubmit,
  });
  
  const handleForgotPassword = useCallback(() => {
    showToastError('Please contact your administrator to reset your password.');
  }, [showToastError]);
  
  const isBusy = isSubmitting || isGuestSubmitting;
  
  return (
    <AuthCard title="Sign In" subtitle="Access your field operations platform">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* General Error */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: colors.danger.muted,
              color: colors.danger.DEFAULT,
            }}
            role="alert"
          >
            {errors.general}
          </motion.div>
        )}
        
        {/* Rate Limit Lock */}
        {isLocked && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: colors.warning.muted,
              color: colors.warning.DEFAULT,
            }}
            role="alert"
          >
            Too many attempts. Please wait {lockRemaining}s before trying again.
          </motion.div>
        )}
        
        <AuthInput
          ref={emailInputRef}
          type="text"
          icon={Mail}
          label="Email or Username"
          value={email}
          onChange={setEmail}
          placeholder="Email or username"
          required
          autoFocus
          disabled={isBusy}
          error={errors.email}
          autoComplete="username"
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label 
              className="block text-sm font-semibold"
              style={{ color: colors.text.secondary }}
            >
              Password
            </label>
            <button 
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-bold uppercase tracking-wider transition-colors"
              style={{ color: colors.accent.DEFAULT }}
              onMouseEnter={(e) => e.currentTarget.style.color = colors.accent.light}
              onMouseLeave={(e) => e.currentTarget.style.color = colors.accent.DEFAULT}
            >
              Forgot password?
            </button>
          </div>
          <PasswordInput
            value={password}
            onChange={setPassword}
            disabled={isBusy}
            error={errors.password}
            autoComplete="current-password"
          />
        </div>

        <div className="mt-6">
          <AuthButton type="submit" isLoading={isSubmitting} disabled={isLocked}>
            Sign In
          </AuthButton>
        </div>
      </form>

      <AuthDivider text="Or" />

      <AuthSecondaryButton
        onClick={handleGuestLogin}
        disabled={isBusy || isLocked}
        icon={User}
      >
        Login as Guest
      </AuthSecondaryButton>

      <AuthFooter 
        text="Don't have an account?"
        linkText="Register now"
        to="/register"
      />
    </AuthCard>
  );
});

LoginForm.displayName = 'LoginForm';
