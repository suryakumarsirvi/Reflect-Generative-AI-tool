import React from 'react';
import { useNavigate } from 'react-router';

const ForgotPassword = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#171615] text-white">
      <div className="flex flex-col items-center max-w-sm w-full p-6">
        <div className="mb-8 flex items-center">
          <img src="./image/without.png" alt="Logo" className="h-12" />
          <h1 className='text-4xl font-semibold'>Discovery</h1>
        </div>

        <h1 className="text-2xl font-serif mb-2">Reset Password</h1>
        <p className="text-neutral-400 text-sm text-center mb-8">
          This feature is currently under development. Please check back later.
        </p>

        <button 
          onClick={() => navigate('/')}
          className="w-full px-4 py-2 cursor-pointer bg-white text-black font-medium text-sm hover:bg-neutral-200 transition-colors rounded"
        >
          Go Back to Home
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
