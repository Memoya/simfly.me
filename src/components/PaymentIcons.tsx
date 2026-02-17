import React from 'react';
import { Visa, Mastercard, Applepay, Googlepay, Klarna } from 'react-pay-icons';

// Using components from react-pay-icons package as requested by the user.
// These are SVGs maintained by the community and should be stable.

export const VisaLogo = ({ className }: { className?: string }) => (
    <Visa className={className} style={{ width: '100%', height: '100%' }} />
);

export const MastercardLogo = ({ className }: { className?: string }) => (
    <Mastercard className={className} style={{ width: '100%', height: '100%' }} />
);

export const ApplePayLogo = ({ className }: { className?: string }) => (
    <Applepay className={className} style={{ width: '100%', height: '100%' }} />
);

export const GooglePayLogo = ({ className }: { className?: string }) => (
    <Googlepay className={className} style={{ width: '100%', height: '100%' }} />
);

export const KlarnaLogo = ({ className }: { className?: string }) => (
    <Klarna className={className} style={{ width: '100%', height: '100%' }} />
);
