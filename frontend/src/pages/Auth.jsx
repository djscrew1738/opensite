/**
 * Authentication Pages
 * Login and Register components for Job Pulse
 * 
 * @module pages/Auth
 */

import { motion } from 'framer-motion';
import { 
  AuthLayout, 
  AuthLogoHeader, 
  AuthSecurityBadge,
  LoginForm,
  RegisterForm,
  containerVariants,
} from '../components/auth';

/**
 * Login Page Component
 */
export function Login() {
  return (
    <AuthLayout pageTitle="Sign In">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full relative z-10"
      >
        <AuthLogoHeader 
          title="Job Pulse" 
          subtitle="CTL Plumbing LLC Intelligence"
        />
        
        <LoginForm />
        <AuthSecurityBadge />
      </motion.div>
    </AuthLayout>
  );
}

Login.displayName = 'Login';

/**
 * Register Page Component
 */
export function Register() {
  return (
    <AuthLayout pageTitle="Create Account">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full relative z-10"
      >
        <AuthLogoHeader 
          title="Create Account" 
          subtitle="Join the Job Pulse platform"
          iconSize="small"
        />
        
        <RegisterForm />
      </motion.div>
    </AuthLayout>
  );
}

Register.displayName = 'Register';
