export type DecimalValue = {
  readonly units: bigint;
  readonly scale: number;
};

export const ZERO_DECIMAL: DecimalValue = { units: 0n, scale: 0 };

export function parseDecimal(value: string, description: string): DecimalValue {
  const token = value.replaceAll(',', '').match(/-?\d+(?:\.\d+)?/)?.[0];

  if (!token) {
    throw new Error(`${description} does not contain a valid decimal value.`);
  }

  const negative = token.startsWith('-');
  const unsigned = negative ? token.slice(1) : token;
  const [integerPart, fractionalPart = ''] = unsigned.split('.');
  const digits = `${integerPart}${fractionalPart}`.replace(/^0+(?=\d)/, '');
  const units = BigInt(`${negative ? '-' : ''}${digits || '0'}`);

  return { units, scale: fractionalPart.length };
}

function tenTo(power: number): bigint {
  return 10n ** BigInt(power);
}

function alignScale(value: DecimalValue, scale: number): bigint {
  return value.units * tenTo(scale - value.scale);
}

export function addDecimals(
  left: DecimalValue,
  right: DecimalValue
): DecimalValue {
  const scale = Math.max(left.scale, right.scale);
  return {
    units: alignScale(left, scale) + alignScale(right, scale),
    scale,
  };
}

export function multiplyDecimals(
  left: DecimalValue,
  right: DecimalValue
): DecimalValue {
  return {
    units: left.units * right.units,
    scale: left.scale + right.scale,
  };
}

export function absoluteDecimal(value: DecimalValue): DecimalValue {
  return {
    units: value.units < 0n ? -value.units : value.units,
    scale: value.scale,
  };
}

export function roundDecimal(
  value: DecimalValue,
  targetScale: number
): DecimalValue {
  if (value.scale <= targetScale) {
    return {
      units: alignScale(value, targetScale),
      scale: targetScale,
    };
  }

  const divisor = tenTo(value.scale - targetScale);
  const absoluteUnits = value.units < 0n ? -value.units : value.units;
  const quotient = absoluteUnits / divisor;
  const remainder = absoluteUnits % divisor;
  const roundedMagnitude = remainder * 2n >= divisor ? quotient + 1n : quotient;

  return {
    units: value.units < 0n ? -roundedMagnitude : roundedMagnitude,
    scale: targetScale,
  };
}

export function decimalsEqual(
  left: DecimalValue,
  right: DecimalValue
): boolean {
  const scale = Math.max(left.scale, right.scale);
  return alignScale(left, scale) === alignScale(right, scale);
}

export function decimalToString(value: DecimalValue): string {
  const negative = value.units < 0n;
  const magnitude = (negative ? -value.units : value.units)
    .toString()
    .padStart(value.scale + 1, '0');
  const integerPart =
    value.scale === 0
      ? magnitude
      : magnitude.slice(0, -value.scale);
  const fractionalPart =
    value.scale === 0
      ? ''
      : magnitude.slice(-value.scale).replace(/0+$/, '');
  const sign = negative && value.units !== 0n ? '-' : '';

  return `${sign}${integerPart}${fractionalPart ? `.${fractionalPart}` : ''}`;
}

export function decimalToNumber(value: DecimalValue): number {
  return Number(decimalToString(value));
}
