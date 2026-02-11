import React, { useState } from 'react';
import { useGuestSignupStartMutation, useGuestSignupVerifyMutation } from '@/store/api/authApi';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { toast } from 'sonner';

interface PaymentIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  affidavitTypeId: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answers: any;
  draftText?: string;
  onSuccess?: () => void;
}

export const PaymentIdentityModal: React.FC<PaymentIdentityModalProps> = ({
  isOpen,
  onClose,
  affidavitTypeId,
  answers,
  draftText,
  onSuccess
}) => {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: ''
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  
  const [startSignup, { isLoading: isStarting }] = useGuestSignupStartMutation();
  const [verifySignup, { isLoading: isVerifying }] = useGuestSignupVerifyMutation();
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getFirstError = (value: unknown): string | null => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && value.length > 0) return String(value[0]);
    return null;
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await startSignup(formData).unwrap();
      setStep('otp');
    } catch (err) {
      const data = (err as { data?: Record<string, unknown> })?.data;
      const emailErr = getFirstError(data?.email);
      const phoneErr = getFirstError(data?.phone_number);
      const detailErr = getFirstError(data?.detail);

      const message =
        emailErr ||
        phoneErr ||
        detailErr ||
        'Failed to send verification code. Please try again.';

      setError(message);
      toast.error(message);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const result = await verifySignup({
        ...formData,
        otp,
        affidavit_type_id: affidavitTypeId,
        answers_json: answers,
        draft_text: draftText
      }).unwrap();

      // Login
      dispatch(setCredentials({
        user: result.user,
        token: result.access,
      }));

      if (onSuccess) onSuccess();

      const requestStatus = result.request?.status;
      const defaultMode = result.request?.affidavit_type?.default_mode;

      if (requestStatus === 'needs_review' || defaultMode === 'review_first') {
        navigate(ROUTES.REQUEST_STATUS.replace(':id', result.request.id.toString()));
        return;
      }

      navigate(ROUTES.REQUEST_SELECT_COMMISSIONER.replace(':id', result.request.id.toString()));
      
    } catch (err) {
      const data = (err as { data?: Record<string, unknown> })?.data;
      const otpErr = getFirstError(data?.otp);
      const emailErr = getFirstError(data?.email);
      const phoneErr = getFirstError(data?.phone_number);
      const detailErr = getFirstError(data?.detail);

      const message =
        otpErr ||
        emailErr ||
        phoneErr ||
        detailErr ||
        'Invalid code or verification failed.';

      setError(message);
      toast.error(message);

      if (emailErr || phoneErr) {
        setOtp('');
        setStep('details');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4">
          {step === 'details' ? 'Verify Details to Process Payment' : 'Enter Verification Code'}
        </h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={handleStart} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Full Name</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded"
                value={formData.full_name}
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input 
                type="email" 
                className="w-full border p-2 rounded"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <input 
                type="tel" 
                className="w-full border p-2 rounded"
                value={formData.phone_number}
                onChange={e => setFormData({...formData, phone_number: e.target.value})}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isStarting}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isStarting ? 'Sending...' : 'Continue to Payment'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-gray-600">
              We sent a code to {formData.email}. (Mock: Enter 123456)
            </p>
            <div>
              <label className="block text-sm font-medium">Verification Code</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded text-center text-2xl tracking-widest"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isVerifying}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {isVerifying ? 'Processing...' : 'Verify & Pay'}
            </button>
            <button 
              type="button"
              onClick={() => {
                setError('');
                setOtp('');
                setStep('details');
              }}
              className="w-full text-gray-500 text-sm"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
