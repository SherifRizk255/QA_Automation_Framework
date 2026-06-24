/**
 * Returns a masked version of a string for safe logging.
 * Never pass raw OTP, National ID, or passwords to console/reports.
 */
export function maskValue(value: string, label: string): string {
  if (!value) return `${label}:[empty]`;
  return `${label}:[***]`;
}

export function maskOtp(otp: string): string {
  return maskValue(otp, 'OTP');
}

export function maskNationalId(nationalId: string): string {
  return maskValue(nationalId, 'NationalID');
}

export function maskPassword(password: string): string {
  return maskValue(password, 'Password');
}

/**
 * Replaces all occurrences of sensitiveValues inside a string with [***].
 * Use this to sanitize log lines that may accidentally contain raw sensitive values.
 */
export function sanitizeLogLine(line: string, sensitiveValues: string[]): string {
  let result = line;
  for (const val of sensitiveValues) {
    if (val && val.trim()) {
      result = result.split(val).join('[***]');
    }
  }
  return result;
}
