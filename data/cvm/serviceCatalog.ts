/**
 * CVM service hierarchy — the SINGLE SOURCE OF TRUTH for the kiosk/agent flows.
 *
 * Verified against the live Kiosk Portal on 2026-08-20
 * (docs/analysis/cvm-kiosk-walkthrough.md). Labels are the EXACT UI strings and
 * are used directly as accessible-name locators (getByRole button name), so they
 * must match the application character-for-character — including the app's own
 * typo "Investment Produsts".
 *
 * To add / remove / rename a service or sub-service, edit ONLY this file — the
 * distribution, page objects, and spec are data-driven off it (brief §10).
 */

/** Logical agent role that serves a service (credentials resolved in config/resources.ts). */
export type AgentRole = 'teller' | 'operations' | 'customerService';

export interface CvmService {
  /** Exact main-service label as shown on the kiosk "select a service" screen. */
  readonly name: string;
  /** Agent role that receives this service's tickets (routing; segments were removed). */
  readonly agentRole: AgentRole;
  /** Leading letter of the generated ticket number, e.g. "T" → "T-514". */
  readonly ticketPrefix: string;
  /** Exact sub-service labels shown on the kiosk "Select your sub-services" screen. */
  readonly subServices: readonly string[];
}

export const SERVICE_CATALOG: readonly CvmService[] = [
  {
    name: 'Tellers',
    agentRole: 'teller',
    ticketPrefix: 'T',
    subServices: [
      'Cash Withdrawals',
      'Combined Transactions',
      'Deposits Above 1.5 Million',
      'Deposits Below 1.5 Million',
    ],
  },
  {
    name: 'Operations',
    agentRole: 'operations',
    ticketPrefix: 'O',
    subServices: [
      'Cheque Book',
      'Cheque Collection',
      'Others',
      'Trade Finance',
      'Transfers',
    ],
  },
  {
    name: 'Customer Services',
    agentRole: 'customerService',
    ticketPrefix: 'A', // observed live: Customer Services tickets are "A-<n>".
    subServices: [
      'Certificate of Deposits',
      'Credit Cards',
      'Dormant Accounts',
      'Investment Produsts', // sic — typo in the application UI; matched exactly on purpose.
      'KYC Updates',
      'New Accounts',
      'Others',
      'Time Deposits',
    ],
  },
] as const;

export function serviceByName(name: string): CvmService {
  const service = SERVICE_CATALOG.find((s) => s.name === name);
  if (!service) throw new Error(`Unknown CVM service: "${name}"`);
  return service;
}
