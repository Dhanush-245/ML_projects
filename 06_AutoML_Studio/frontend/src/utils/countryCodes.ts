export interface CountryCode {
  name: string;
  code: string;
  flag: string;
  format: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { name: 'India', code: '+91', flag: '🇮🇳', format: '98765 43210' },
  { name: 'United States', code: '+1', flag: '🇺🇸', format: '(555) 019-2834' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', format: '7911 123456' },
  { name: 'Canada', code: '+1', flag: '🇨🇦', format: '(555) 019-2834' },
  { name: 'Australia', code: '+61', flag: '🇦🇺', format: '412 345 678' },
  { name: 'Germany', code: '+49', flag: '🇩🇪', format: '151 12345678' },
  { name: 'France', code: '+33', flag: '🇫🇷', format: '6 12 34 56 78' },
  { name: 'Japan', code: '+81', flag: '🇯🇵', format: '90 1234 5678' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪', format: '50 123 4567' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬', format: '8123 4567' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦', format: '50 123 4567' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷', format: '11 91234-5678' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽', format: '55 1234 5678' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦', format: '82 123 4567' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬', format: '802 123 4567' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩', format: '812-3456-7890' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾', format: '12-345 6789' },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰', format: '300 1234567' },
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩', format: '1712-345678' },
  { name: 'Italy', code: '+39', flag: '🇮🇹', format: '312 345 6789' },
  { name: 'Spain', code: '+34', flag: '🇪🇸', format: '612 34 56 78' },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱', format: '6 12345678' },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭', format: '79 123 45 67' },
  { name: 'Sweden', code: '+46', flag: '🇸🇪', format: '70 123 45 67' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷', format: '10-1234-5678' },
  { name: 'China', code: '+86', flag: '🇨🇳', format: '138 1234 5678' },
  { name: 'New Zealand', code: '+64', flag: '🇳🇿', format: '21 123 4567' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭', format: '917 123 4567' },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳', format: '91 234 56 78' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭', format: '81 234 5678' },
  { name: 'Egypt', code: '+20', flag: '🇪🇬', format: '100 123 4567' },
  { name: 'Kenya', code: '+254', flag: '🇰🇪', format: '712 345678' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷', format: '9 11 1234-5678' },
  { name: 'Chile', code: '+56', flag: '🇨🇱', format: '9 1234 5678' },
  { name: 'Colombia', code: '+57', flag: '🇨🇴', format: '300 123 4567' },
];

export const normalizePhoneNumber = (code: string, phone: string): string => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const cleanCode = code.replace(/[^0-9+]/g, '');
  return `${cleanCode}${cleanPhone}`;
};
