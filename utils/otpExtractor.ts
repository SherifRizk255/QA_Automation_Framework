const OTP_PATTERN = /Please use the following OTP to complete your authentication:\s*(\d+)/i;

/**
 * Extracts the OTP value from a CRM SMS message body.
 * Throws if the pattern is not found — never silently returns empty.
 */
export function extractOtpFromMessage(messageText: string): string {
  const match = OTP_PATTERN.exec(messageText);
  if (!match || !match[1]) {
    throw new Error(
      'OTP not found in message. The CRM message format may have changed. ' +
      'Expected pattern: "Please use the following OTP to complete your authentication: {digits}"'
    );
  }
  return match[1];
}

/**
 * Returns true if the message contains the expected OTP pattern (non-extracting check).
 */
export function messageContainsOtp(messageText: string): boolean {
  return OTP_PATTERN.test(messageText);
}
