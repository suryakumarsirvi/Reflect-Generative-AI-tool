import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import useAuth from '../hooks/useAuth';

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.641-.026 2.669-1.48 3.666-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.688.78-1.325 2.208-1.143 3.597 1.35.105 2.624-.623 3.43-1.584z" />
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleLogin, handleGoogleAuth } = useAuth();

  const validate = (name, value) => {
    let error = '';
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) error = 'Email is required';
      else if (!emailRegex.test(value)) error = 'Invalid email address';
    }
    if (name === 'password') {
      if (!value) error = 'Password is required';
      else if (value.length < 6) error = 'Password must be at least 6 characters';
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validate(name, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailError = validate('email', formData.email);
    const passwordError = validate('password', formData.password);

    if (!emailError && !passwordError) {
      setIsSubmitting(true);
      setTimeout(() => {
        console.log('Login successful', formData);
        handleLogin(formData);
        setIsSubmitting(false);
        setFormData({ email: '', password: '' });
        navigate('/home');
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-sm w-full p-6">
      <div className="mb-8 flex items-center">
        <img src="./image/without.png" alt="Logo" className="h-12" />
        <h1 className='text-4xl font-semibold'>Discovery</h1>
      </div>

      <h1 className="text-2xl font-serif font-medium mb-6 w-full text-center">Sign up below to unlock the full potential of Discovery AI</h1>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email address"
            className={`w-full px-4 py-2.5 bg-neutral-800/50 border ${errors.email ? 'border-red-500/50' : 'border-neutral-700/50'} rounded-md text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors`}
          />
          {errors.email && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.email}</p>}
        </div>

        <div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className={`w-full px-4 py-2.5 bg-neutral-800/50 border ${errors.password ? 'border-red-500/50' : 'border-neutral-700/50'} rounded-md text-sm placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors`}
          />
          {errors.password && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || Object.values(errors).some(e => e)}
          className="w-full flex justify-center cursor-pointer items-center h-10 bg-white text-black font-medium text-sm rounded-md hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {isSubmitting ? <div className="spinner w-4 h-4" /> : "Continue"}
        </button>
      </form>

      <div className="w-full flex items-center my-6">
        <div className="flex-1 h-px bg-neutral-800"></div>
        <span className="px-4 text-xs text-neutral-500">OR</span>
        <div className="flex-1 h-px bg-neutral-800"></div>
      </div>

      <div className="w-full space-y-3">
        <button
          type="button"
          onClick={handleGoogleAuth}
          className="w-full flex cursor-pointer items-center justify-center gap-3 h-10 border border-neutral-700/50 rounded-md text-sm hover:bg-neutral-800/50 transition-colors"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <button className="w-full flex cursor-pointer items-center justify-center gap-3 h-10 border border-neutral-700/50 rounded-md text-sm hover:bg-neutral-800/50 transition-colors">
          <AppleIcon />
          Continue with Apple
        </button>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2 text-xs text-neutral-400">
        <button onClick={() => navigate('/forgot-password')} className="cursor-pointer hover:text-white transition-colors">
          Forgot your password?
        </button>
        <p>
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} className="cursor-pointer text-white hover:underline">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;