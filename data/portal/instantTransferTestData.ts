export const instantTransferTestData = {
  mobile: {
    invalidTooShort: '01012',
    invalidTooLong: '01012345678999',
    invalidNonNumeric: '01012ABCD89',
  },
  card: {
    fewerThan16Digits: '411111111111111',
    moreThan16Digits: '41111111111111112',
    nonNumeric: '41111111ABCD1111',
  },
  bankAccount: {
    moreThan35Digits: '123456789012345678901234567890123456',
  },
  iban: {
    validUppercaseMax35: 'EG12000123456789012345678901234',
    moreThan35Characters: 'EG1200012345678901234567890123456',
    lowercase: 'eg12000123456789012345678901234',
    specialCharacters: 'EG12-0001 234567890123456789012',
  },
  ipa: {
    prefixTooShort: 'abc@bank.eg',
    prefixTooLong: 'abcdefghijklmnopqrstuvwxyz@bank.eg',
    totalTooLong: 'abcdefghijklmnopqrstuvwxy@bank-eg-long.eg',
    mixedCase: 'IPA1@bank.eg',
    unsupportedCharacters: 'ipa_name@bank.eg',
    allowedSpecialCharacters: 'ipa-1.test@bank.eg',
  },
};

export const instantTransferBlockedCases = [
  {
    id: 'SAIB-2189',
    reason: 'Requires manually tampered non-EGP API request outside the approved UI automation scope.',
  },
  {
    id: 'SAIB-2193',
    reason: 'Requires transaction completion to prove one-time beneficiary is not persisted.',
  },
  {
    id: 'SAIB-2194',
    reason: 'Requires OTP confirmation and beneficiary persistence.',
  },
  {
    id: 'SAIB-2195',
    reason: 'Requires submitting valid Add Beneficiary data to OTP challenge.',
  },
  {
    id: 'SAIB-2196',
    reason: 'Requires valid OTP entry.',
  },
  {
    id: 'SAIB-2197',
    reason: 'Requires OTP challenge interaction.',
  },
  {
    id: 'SAIB-2200',
    reason: 'Requires approved valid mobile/IPN test data for beneficiary name retrieval.',
  },
  {
    id: 'SAIB-2201',
    reason: 'Requires controlled IPN name-retrieval failure data.',
  },
  {
    id: 'SAIB-2202',
    reason: 'Requires asserting OTP gating after successful external name retrieval.',
  },
  {
    id: 'SAIB-2204',
    reason: 'Requires controlled unregistered mobile number against IPN service.',
  },
  {
    id: 'SAIB-2205',
    reason: 'Requires registered mobile resolving to Arabic beneficiary data.',
  },
  {
    id: 'SAIB-2210',
    reason: 'Requires controlled card number absent from IPN network.',
  },
  {
    id: 'SAIB-2219',
    reason: 'Requires valid IPA/PSP lookup test data.',
  },
  {
    id: 'SAIB-2224',
    reason: 'Requires valid IPA data that resolves through PSP validation.',
  },
  {
    id: 'SAIB-2226',
    reason: 'Requires IPA-linked Arabic display name in downstream service.',
  },
  {
    id: 'SAIB-2227',
    reason: 'Requires controlled non-existent IPA address against PSP service.',
  },
  {
    id: 'SAIB-2228',
    reason: 'Requires valid IPA with accepted special characters and downstream resolution.',
  },
  {
    id: 'SAIB-2230',
    reason: 'Requires valid wallet number resolving through external wallet/IPN service.',
  },
];
