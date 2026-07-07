/**
 * Shared failure classification — the single implementation of the F1–F5
 * failure classes used by the Cubic HTML reporter (skill 25), the markdown
 * execution summary, and the Failure Analysis Agent (skill 15).
 *
 * F1 Automation script issue — locator broken, wrong assertion, test logic error
 * F2 Application defect     — system behavior does not match requirement → bug report
 * F3 Test data issue        — data missing, expired, wrong state
 * F4 Environment issue      — connectivity, config, deployment, service down
 * F5 Requirement ambiguity  — behavior unspecified or contradictory
 */

export interface FailureClassification {
  code: 'F1' | 'F2' | 'F3' | 'F4' | 'F5';
  label: string;
  /** Plain-language verdict: is this the test's fault or the system's fault? */
  verdict: string;
  recommendation: string;
}

const CLASSES: Record<FailureClassification['code'], Omit<FailureClassification, 'recommendation'>> = {
  F1: {
    code: 'F1',
    label: 'Automation script issue',
    verdict: 'Test implementation failure — the system under test is probably fine; fix the automation.',
  },
  F2: {
    code: 'F2',
    label: 'Application defect',
    verdict: 'Potential bug in the system under test — raise/review a defect with the attached evidence.',
  },
  F3: {
    code: 'F3',
    label: 'Test data issue',
    verdict: 'Test data problem — neither the system nor the script logic is proven wrong yet.',
  },
  F4: {
    code: 'F4',
    label: 'Environment issue',
    verdict: 'Environment/connectivity problem — rerun after the environment is healthy.',
  },
  F5: {
    code: 'F5',
    label: 'Requirement ambiguity',
    verdict: 'Expected behavior is unclear — clarify the requirement before blaming test or system.',
  },
};

export function classifyFailureMessage(message: string): FailureClassification {
  const text = message.toLowerCase();

  // Known application-defect signatures for the active project.
  if (
    /active session blocker appeared and was handled/i.test(text) ||
    /transfer between my accounts form did not display|from account dropdown|to account dropdown/i.test(text)
  ) {
    return { ...CLASSES.F2, recommendation: recommendationFor('F2', message) };
  }

  if (/portal_username|portal_password|crm_username|crm_password|credentials|unauthorized|invalid user|invalid password|auth blocked/i.test(text)) {
    return { ...CLASSES.F3, recommendation: recommendationFor('F3', message) };
  }

  if (/net::|err_|dns|certificate|econnreset|econnrefused|etimedout|connection|browser has been closed|target closed/i.test(text)) {
    return { ...CLASSES.F4, recommendation: recommendationFor('F4', message) };
  }

  if (/locator|strict mode|not.tohaveurl|tohaveurl|waiting for|expected.*visible|to be visible|resolved to \d+ elements|element is not/i.test(text)) {
    return { ...CLASSES.F1, recommendation: recommendationFor('F1', message) };
  }

  // Generic assertion timeout with no locator signature → environment-flavored
  // timeout stays ambiguous; keep it F1 when an expect() is present, else F5.
  if (/expect\(|assertion|tobe|tohave|tomatch/i.test(text)) {
    return { ...CLASSES.F1, recommendation: recommendationFor('F1', message) };
  }
  if (/timeout/i.test(text)) {
    return { ...CLASSES.F4, recommendation: recommendationFor('F4', message) };
  }

  return { ...CLASSES.F5, recommendation: recommendationFor('F5', message) };
}

export function recommendationFor(code: FailureClassification['code'], message: string): string {
  switch (code) {
    case 'F2':
      if (/transfer between my accounts form did not display/i.test(message)) {
        return 'Validate the Between My Accounts card action and ensure the From/To Account form renders for the authenticated retail customer.';
      }
      return 'Raise or review an application defect with the captured screenshot, video, and trace.';
    case 'F1':
      return 'Inspect the live page, update the locator in docs/analysis/locator-repository.json or the page object, and re-run the spec in isolation.';
    case 'F3':
      return 'Verify .env credentials and that the test account has the required data state (eligible accounts, records, permissions).';
    case 'F4':
      return 'Check system availability, HTTPS access, VPN/proxy, and test environment health; re-run once healthy.';
    case 'F5':
      return 'Clarify the expected business behavior with the requirement owner or provide backend/API data for stronger validation.';
  }
}

export function stripAnsi(value: string): string {
  // Covers both raw ESC sequences and the bracket-only form left after JSON serialization.
  // eslint-disable-next-line no-control-regex
  return value.replace(/\u001b\[[0-9;]*m/g, '').replace(/\[[0-9;]*m/g, '');
}
