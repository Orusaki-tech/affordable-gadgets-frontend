'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/utils/format';

interface PaymentMethodModalProps {
  onClose: () => void;
  onProceed: (paymentMethod: string, mobileNumber?: string) => void;
  totalAmount: number;
  merchantName?: string;
  isLoading?: boolean;
}

type PaymentMethod = 'mpesa' | 'airtel' | 'card' | 'pesapal';

export function PaymentMethodModal({
  onClose,
  onProceed,
  totalAmount,
  merchantName = 'AFFORDABLE GADGETS',
  isLoading = false,
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mpesa');
  const [mobileNumber, setMobileNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+254');

  const handleProceed = () => {
    if (selectedMethod === 'mpesa' || selectedMethod === 'airtel') {
      if (!mobileNumber || mobileNumber.length < 9) {
        alert('Please enter a valid mobile number');
        return;
      }
      // Format phone number with country code
      const fullPhoneNumber = `${countryCode}${mobileNumber.replace(/^0+/, '')}`;
      onProceed(selectedMethod, fullPhoneNumber);
    } else {
      onProceed(selectedMethod);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 9 digits (Kenyan phone numbers)
    return digits.slice(0, 9);
  };

  return (
    <div className="payment-method-modal">
      <div className="payment-method-modal__panel">
        <button
          type="button"
          onClick={onClose}
          className="payment-method-modal__close"
          aria-label="Close payment modal"
        >
          <svg className="payment-method-modal__close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="payment-method-modal__header">
          <h2 className="payment-method-modal__title">
            Choose a payment option
          </h2>
          <p className="payment-method-modal__subtitle">
            Secure checkout powered by trusted payment providers.
          </p>
        </div>

        {/* Payment Options */}
        <div className="payment-method-modal__options">
          {/* M-PESA Option */}
          <label className={`payment-method-modal__option payment-method-modal__option--mpesa ${
            selectedMethod === 'mpesa' 
              ? 'payment-method-modal__option--active'
              : ''
          }`}>
            <input
              type="radio"
              name="paymentMethod"
              value="mpesa"
              checked={selectedMethod === 'mpesa'}
              onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
              className="payment-method-modal__radio payment-method-modal__radio--mpesa"
            />
            <div className="payment-method-modal__option-content">
              <div className="payment-method-modal__brand payment-method-modal__brand--mpesa">
                <span className="payment-method-modal__brand-text">M</span>
              </div>
              <span className="payment-method-modal__option-label">M-PESA</span>
            </div>
          </label>

          {/* Airtel Money Option */}
          <label className={`payment-method-modal__option payment-method-modal__option--airtel ${
            selectedMethod === 'airtel' 
              ? 'payment-method-modal__option--active'
              : ''
          }`}>
            <input
              type="radio"
              name="paymentMethod"
              value="airtel"
              checked={selectedMethod === 'airtel'}
              onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
              className="payment-method-modal__radio payment-method-modal__radio--airtel"
            />
            <div className="payment-method-modal__option-content">
              <div className="payment-method-modal__brand payment-method-modal__brand--airtel">
                <span className="payment-method-modal__brand-text">A</span>
              </div>
              <span className="payment-method-modal__option-label">Airtel Money</span>
            </div>
          </label>

          {/* Card Payments Option */}
          <label className={`payment-method-modal__option payment-method-modal__option--card ${
            selectedMethod === 'card' 
              ? 'payment-method-modal__option--active'
              : ''
          }`}>
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={selectedMethod === 'card'}
              onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
              className="payment-method-modal__radio payment-method-modal__radio--card"
            />
            <div className="payment-method-modal__option-content">
              <div className="payment-method-modal__card-icons">
                <div className="payment-method-modal__card-icon payment-method-modal__card-icon--visa">
                  <span className="payment-method-modal__card-text">VISA</span>
                </div>
                <div className="payment-method-modal__card-icon payment-method-modal__card-icon--mc">
                  <span className="payment-method-modal__card-text">MC</span>
                </div>
                <div className="payment-method-modal__card-icon payment-method-modal__card-icon--ae">
                  <span className="payment-method-modal__card-text">AE</span>
                </div>
              </div>
              <span className="payment-method-modal__option-label">Card Payments</span>
            </div>
          </label>

          {/* Pesapal Gateway Option */}
          <label className={`payment-method-modal__option payment-method-modal__option--pesapal ${
            selectedMethod === 'pesapal' 
              ? 'payment-method-modal__option--active'
              : ''
          }`}>
            <input
              type="radio"
              name="paymentMethod"
              value="pesapal"
              checked={selectedMethod === 'pesapal'}
              onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
              className="payment-method-modal__radio payment-method-modal__radio--pesapal"
            />
            <div className="payment-method-modal__option-content">
              <div className="payment-method-modal__card-icons">
                <div className="payment-method-modal__card-icon payment-method-modal__card-icon--visa">
                  <span className="payment-method-modal__card-text">VISA</span>
                </div>
                <div className="payment-method-modal__card-icon payment-method-modal__card-icon--wallet">
                  <span className="payment-method-modal__card-text payment-method-modal__card-text--wallet">e-wallet</span>
                </div>
              </div>
              <span className="payment-method-modal__option-label">Pesapal Gateway</span>
            </div>
          </label>
        </div>

        {/* Payment Summary */}
        <div className="payment-method-modal__summary">
          <p className="payment-method-modal__summary-text">
            Pay <span className="payment-method-modal__summary-merchant">"{merchantName}"</span> {formatPrice(totalAmount)}
          </p>
        </div>

        {/* MPESA Instructions */}
        {(selectedMethod === 'mpesa' || selectedMethod === 'airtel') && (
          <div className="payment-method-modal__instructions">
            <h3 className="payment-method-modal__instructions-title">
              {selectedMethod === 'mpesa' ? 'M-PESA Payment Instructions:' : 'Airtel Money Payment Instructions:'}
            </h3>
            <ol className="payment-method-modal__instructions-list">
              <li>
                Provide your {selectedMethod === 'mpesa' ? 'MPESA' : 'Airtel Money'} [KE] mobile number below
              </li>
              <li>
                Click Proceed and a prompt will appear on your phone requesting you to confirm transaction by providing your{' '}
                {selectedMethod === 'mpesa' ? 'MPESA' : 'Airtel Money'} PIN
              </li>
              <li>
                Once completed, you will receive the confirmation SMS for this transaction
              </li>
            </ol>

            {/* Mobile Number Input */}
            <div className="payment-method-modal__input-group">
              <label className="payment-method-modal__label">
                <svg
                  className="payment-method-modal__label-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Provide your {selectedMethod === 'mpesa' ? 'Mpesa' : 'Airtel Money'} [KE] Mobile number
              </label>
              <div className="payment-method-modal__input-row">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="payment-method-modal__select"
                >
                  <option value="+254">+254</option>
                  <option value="+255">+255</option>
                  <option value="+256">+256</option>
                  <option value="+250">+250</option>
                </select>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(formatPhoneNumber(e.target.value))}
                  placeholder="727504393"
                  className="payment-method-modal__input"
                  maxLength={9}
                />
              </div>
            </div>
          </div>
        )}

        {/* Card/Pesapal Instructions */}
        {(selectedMethod === 'card' || selectedMethod === 'pesapal') && (
          <div className="payment-method-modal__note">
            <p>
              You will be redirected to a secure payment page to complete your transaction using your preferred card.
            </p>
          </div>
        )}

        {/* Regulatory Information */}
        <p className="payment-method-modal__regulatory">
          Pesapal is Regulated by the Central Bank of Kenya
        </p>

        {/* Action Buttons */}
        <div className="payment-method-modal__actions">
          <button
            type="button"
            onClick={onClose}
            className="payment-method-modal__button payment-method-modal__button--secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProceed}
            disabled={isLoading || (selectedMethod !== 'card' && selectedMethod !== 'pesapal' && !mobileNumber)}
            className="payment-method-modal__button payment-method-modal__button--primary"
          >
            {isLoading ? 'Processing...' : 'Proceed'}
          </button>
        </div>
      </div>
    </div>
  );
}





