
import React from 'react';
import { signIn } from "next-auth/react";

const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 48 48" className="mr-2">
        <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
    </svg>
);

const GoogleSignInButton = ({ disabled = false, loading = false }) => {
    return (
        <button
            onClick={() => signIn('google')}
            disabled={disabled || loading}
            className={`
        flex items-center justify-center
        w-full px-4 py-3
        bg-white border border-gray-300 rounded-lg
        text-gray-700 font-medium text-sm
        hover:bg-gray-50 hover:border-gray-400
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${loading ? 'cursor-wait' : 'cursor-pointer'}
      `}
        >
            {loading ? (
                <div className="w-5 h-5 mr-2 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
                <GoogleIcon />
            )}
            {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
    );
};
export default GoogleSignInButton;