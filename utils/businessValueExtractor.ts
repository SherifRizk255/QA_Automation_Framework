import type { Locator } from '@playwright/test';

export type BusinessValueExtractionOptions = {
  source: Locator;
  pattern: RegExp;
  description?: string;
};

export async function extractBusinessValue(
  options: BusinessValueExtractionOptions
): Promise<string> {
  const description = options.description?.trim() || 'business value';
  const elementCount = await options.source.count();

  if (elementCount === 0) {
    throw new Error(
      `Business value extraction failed for ${description}: source locator was not found.`
    );
  }

  if (elementCount > 1) {
    throw new Error(
      `Business value extraction failed for ${description}: source locator matched ${elementCount} elements.`
    );
  }

  const source = options.source.first();
  const isVisible = await source.isVisible();

  if (!isVisible) {
    throw new Error(
      `Business value extraction failed for ${description}: source locator is not visible.`
    );
  }

  const fieldText = await source.evaluate((element) => {
    const field = element as HTMLElement & { value?: string; innerText?: string };
    return field.value ?? field.innerText ?? field.textContent ?? field.getAttribute('value') ?? '';
  });
  const normalizedText = fieldText.trim();

  if (normalizedText.length === 0) {
    throw new Error(`Business value extraction failed for ${description}: source field is empty.`);
  }

  const pattern = new RegExp(
    options.pattern.source,
    options.pattern.flags.replace(/[gy]/g, '')
  );
  const match = normalizedText.match(pattern);

  if (!match) {
    throw new Error(
      `Business value extraction failed for ${description}: pattern ${options.pattern.toString()} was not found.`
    );
  }

  return (match[1] ?? match[0]).trim();
}
