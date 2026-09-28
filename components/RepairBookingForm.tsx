'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { getBusinessWhatsAppUrl } from '@/lib/config/brand';
import { allBrandNavItems } from '@/lib/config/nav-links';

const DEVICE_TYPES = [
  { value: 'Phone', label: 'Phone' },
  { value: 'Tablet', label: 'Tablet' },
  { value: 'Laptop', label: 'Laptop' },
  { value: 'Accessory', label: 'Accessory' },
] as const;

const ISSUE_OPTIONS = [
  'Cracked / damaged screen',
  'Battery replacement',
  'Charging / power issues',
  'Water damage',
  'Camera issues',
  'Speaker / microphone',
  "Software / won't turn on",
  'Other',
] as const;

type DeviceTypeValue = (typeof DEVICE_TYPES)[number]['value'];
type IssueValue = (typeof ISSUE_OPTIONS)[number];

function isDeviceType(value: string | null): value is DeviceTypeValue {
  return DEVICE_TYPES.some((opt) => opt.value === value);
}

function isIssue(value: string | null): value is IssueValue {
  return ISSUE_OPTIONS.some((opt) => opt === value);
}

function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 9) return 'Please enter a valid phone number';
  return null;
}

function buildRepairWhatsAppMessage(fields: {
  name: string;
  phone: string;
  deviceType: string;
  brand: string;
  model: string;
  issue: string;
  details: string;
}): string {
  const lines = [
    "Hi! I'd like to book a repair.",
    '',
    `Name: ${fields.name.trim()}`,
    `Phone: ${fields.phone.trim()}`,
    `Device: ${fields.brand} ${fields.model.trim()} (${fields.deviceType})`,
    `Issue: ${fields.issue}`,
  ];
  const details = fields.details.trim();
  if (details) {
    lines.push(`Details: ${details}`);
  }
  lines.push('', 'Please share a quote after diagnosis.');
  return lines.join('\n');
}

export function RepairBookingForm() {
  const searchParams = useSearchParams();
  const initialDeviceType = searchParams.get('deviceType');
  const initialIssue = searchParams.get('issue');

  const brands = useMemo(
    () => [...allBrandNavItems().map((b) => b.navLabel), 'Other'],
    []
  );

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deviceType, setDeviceType] = useState(
    isDeviceType(initialDeviceType) ? initialDeviceType : ''
  );
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [issue, setIssue] = useState(isIssue(initialIssue) ? initialIssue : '');
  const [details, setDetails] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneError = validatePhone(phone);
  const nameError = name.trim().length < 2 ? 'Please enter your name' : null;
  const deviceTypeError = !deviceType ? 'Select a device type' : null;
  const brandError = !brand ? 'Select a brand' : null;
  const modelError = model.trim().length < 1 ? 'Enter the model' : null;
  const issueError = !issue ? 'Select an issue' : null;

  const firstError =
    nameError || phoneError || deviceTypeError || brandError || modelError || issueError;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (firstError) {
      setError(firstError);
      return;
    }
    setError(null);
    const message = buildRepairWhatsAppMessage({
      name,
      phone,
      deviceType,
      brand,
      model,
      issue,
      details,
    });
    window.open(getBusinessWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
  };

  const show = (err: string | null) => touched && err;

  return (
    <form className="repair-page__form" onSubmit={handleSubmit} noValidate>
      <div className="repair-page__form-grid">
        <div className="checkout-modal__field">
          <label htmlFor="repair-name" className="checkout-modal__label">
            Your name <span className="checkout-modal__required">*</span>
          </label>
          <input
            id="repair-name"
            type="text"
            className="checkout-modal__input"
            placeholder="e.g. Jane Wanjiku"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            autoComplete="name"
            aria-invalid={show(nameError) ? true : undefined}
          />
          {show(nameError) && (
            <span className="checkout-modal__error" role="alert">
              {nameError}
            </span>
          )}
        </div>

        <div className="checkout-modal__field">
          <label htmlFor="repair-phone" className="checkout-modal__label">
            Phone number <span className="checkout-modal__required">*</span>
          </label>
          <input
            id="repair-phone"
            type="tel"
            className="checkout-modal__input"
            placeholder="e.g. 0712 345 678"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError(null);
            }}
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={show(phoneError) ? true : undefined}
          />
          {show(phoneError) && (
            <span className="checkout-modal__error" role="alert">
              {phoneError}
            </span>
          )}
        </div>

        <div className="checkout-modal__field">
          <label htmlFor="repair-device-type" className="checkout-modal__label">
            Device type <span className="checkout-modal__required">*</span>
          </label>
          <select
            id="repair-device-type"
            className="checkout-modal__input"
            value={deviceType}
            onChange={(e) => {
              setDeviceType(e.target.value);
              setError(null);
            }}
            aria-invalid={show(deviceTypeError) ? true : undefined}
          >
            <option value="">Select type</option>
            {DEVICE_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {show(deviceTypeError) && (
            <span className="checkout-modal__error" role="alert">
              {deviceTypeError}
            </span>
          )}
        </div>

        <div className="checkout-modal__field">
          <label htmlFor="repair-brand" className="checkout-modal__label">
            Brand <span className="checkout-modal__required">*</span>
          </label>
          <select
            id="repair-brand"
            className="checkout-modal__input"
            value={brand}
            onChange={(e) => {
              setBrand(e.target.value);
              setError(null);
            }}
            aria-invalid={show(brandError) ? true : undefined}
          >
            <option value="">Select brand</option>
            {brands.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
          {show(brandError) && (
            <span className="checkout-modal__error" role="alert">
              {brandError}
            </span>
          )}
        </div>

        <div className="checkout-modal__field repair-page__field--full">
          <label htmlFor="repair-model" className="checkout-modal__label">
            Model <span className="checkout-modal__required">*</span>
          </label>
          <input
            id="repair-model"
            type="text"
            className="checkout-modal__input"
            placeholder="e.g. iPhone 13, Galaxy A54, MacBook Air M2"
            value={model}
            onChange={(e) => {
              setModel(e.target.value);
              setError(null);
            }}
            aria-invalid={show(modelError) ? true : undefined}
          />
          {show(modelError) && (
            <span className="checkout-modal__error" role="alert">
              {modelError}
            </span>
          )}
        </div>

        <div className="checkout-modal__field repair-page__field--full">
          <label htmlFor="repair-issue" className="checkout-modal__label">
            What needs fixing? <span className="checkout-modal__required">*</span>
          </label>
          <select
            id="repair-issue"
            className="checkout-modal__input"
            value={issue}
            onChange={(e) => {
              setIssue(e.target.value);
              setError(null);
            }}
            aria-invalid={show(issueError) ? true : undefined}
          >
            <option value="">Select issue</option>
            {ISSUE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {show(issueError) && (
            <span className="checkout-modal__error" role="alert">
              {issueError}
            </span>
          )}
        </div>

        <div className="checkout-modal__field repair-page__field--full">
          <label htmlFor="repair-details" className="checkout-modal__label">
            Extra details <span className="repair-page__optional">(optional)</span>
          </label>
          <textarea
            id="repair-details"
            className="checkout-modal__textarea"
            rows={3}
            placeholder="When did it start? Any other symptoms?"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>
      </div>

      {error && !show(firstError) && (
        <div className="checkout-modal__alert" role="alert">
          {error}
        </div>
      )}

      <p className="repair-page__quote-note">
        We&apos;ll diagnose your device and send a quote on WhatsApp — no fixed prices online.
      </p>

      <button type="submit" className="whatsapp-lead-modal__primary repair-page__submit">
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden>
          <path d="M19.05 4.91A10.05 10.05 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.74.46 3.44 1.32 4.94L2 22l5.27-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01z" />
        </svg>
        Continue on WhatsApp
      </button>
    </form>
  );
}
