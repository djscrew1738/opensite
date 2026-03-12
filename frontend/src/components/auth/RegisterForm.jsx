/**
 * RegisterForm - Complete registration form component
 * @module components/auth/RegisterForm
 */

import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthCard, AuthInput, PasswordInput, AuthButton } from './';
import { AuthFooter } from './AuthLayout';
import { useRegisterForm } from './useAuthForm';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { colors } from '../../styles/tokens';

/**
 * Register form component
 */
export const RegisterForm = memo(function RegisterForm() {
  const { register } = useAuth();
  const { success: showToastSuccess, error: showToastError } = useToast();
  const navigate = useNavigate();
  
  const handleRegisterSubmit = useCallback(async (userData) => {
    const result = await register(userData);
    showToastSuccess('Account created successfully!');
    navigate('/');
    return result;
  }, [register, navigate, showToastSuccess]);
  
  const {
    formData,
    errors,
    isSubmitting,
    isLocked,
    lockRemaining,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useRegisterForm({ onSubmit: handleRegisterSubmit });
  
  return (
    <AuthCard>
      <form onSubmit={handleSubmit} className="space-y-5 mt-2">
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
          type="text"
          icon={User}
          label="Full Name"
          value={formData.username}
          onChange={(value) => handleChange('username', value)}
          onBlur={() => handleBlur('username')}
          placeholder="John Doe"
          required
          autoFocus
          disabled={isSubmitting}
          error={errors.username}
          autoComplete="name"
        />

        <AuthInput
          type="email"
          icon={Mail}
          label="Email Address"
          value={formData.email}
          onChange={(value) => handleChange('email', value)}
          onBlur={() => handleBlur('email')}
          placeholder="name@ctlplumbing.com"
          required
          disabled={isSubmitting}
          error={errors.email}
          autoComplete="email"
        />

        <PasswordInput
          label="Password"
          value={formData.password}
          onChange={(value) => handleChange('password', value)}
          onBlur={() => handleBlur('password')}
          required
          disabled={isSubmitting}
          error={errors.password}
          showStrength
          minLength={8}
          autoComplete="new-password"
        />

        <PasswordInput
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={(value) => handleChange('confirmPassword', value)}
          onBlur={() => handleBlur('confirmPassword')}
          placeholder="••••••••"
          required
          disabled={isSubmitting}
          error={errors.confirmPassword}
          minLength={8}
          autoComplete="new-password"
        />

        <div className="mt-8">
          <AuthButton type="submit" isLoading={isSubmitting} disabled={isLocked}>
            Create Account
          </AuthButton>
        </div>
      </form>

      <AuthFooter 
        text="Already have an account?"
        linkText="Sign In"
        to="/login"
      />
    </AuthCard>
  );
});

RegisterForm.displayName = 'RegisterForm';
