/**
 * KFH CVM service hierarchy — the SINGLE SOURCE OF TRUTH for the kiosk/agent flows.
 *
 * Verified against the live KFH Kiosk Portal on 2026-09-01
 * (docs/analysis/kfh-kiosk-walkthrough.md). Labels are the EXACT UI strings, used
 * directly as accessible-name / text locators, so they must match the application
 * character-for-character — including the app's own typo "Investment Produsts".
 *
 * To add / remove / rename a service, sub-service, segment, or customer type,
 * edit ONLY this file — the distribution, page objects, and spec are data-driven.
 */

/** Logical agent role that serves a service (credentials resolved in config/resources.ts). */
export type AgentRole = 'teller' | 'operations' | 'customerService';

/** KFH kiosk "Customer / Non-Customer" screen options. */
export const CUSTOMER_TYPES = ['Customer', 'Non-Customer'] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

/** KFH kiosk "Segment" screen options (exact UI text). */
export const SEGMENTS = ['Retail', 'Corporate', 'Special Needs / Senior'] as const;
export type Segment = (typeof SEGMENTS)[number];

export interface CvmService {
  /** Exact main-service label as shown on the kiosk "Select Service" screen. */
  readonly name: string;
  /** Agent role that receives this service's tickets. */
  readonly agentRole: AgentRole;
  /** Leading letter of the generated ticket number, e.g. "T" → "T-501". */
  readonly ticketPrefix: string;
  /** Exact sub-service labels shown on the kiosk "Select Sub Service" screen. */
  readonly subServices: readonly string[];
}

export const SERVICE_CATALOG: readonly CvmService[] = [
  {
    name: 'Tellers',
    agentRole: 'teller',
    ticketPrefix: 'T', // confirmed live: Tellers tickets are "T-<n>".
    subServices: [
      'Deposits Below 1.5 Million',
      'Deposits Above 1.5 Million',
      'Cash Withdrawals',
      'Combined Transactions',
    ],
  },
  {
    name: 'Operations',
    agentRole: 'operations',
    ticketPrefix: 'O', // best-guess; correlation uses the actual number + Service Name.
    subServices: ['Cheque Book', 'Cheque Collection', 'Transfers', 'Others'],
  },
  {
    name: 'Customer Services',
    agentRole: 'customerService',
    ticketPrefix: 'A', // confirmed live: Customer Services tickets are "A-<n>".
    subServices: [
      'Certificate of Deposits',
      'New Accounts',
      'Investment Produsts', // sic — typo in the application UI; matched exactly on purpose.
      'KYC Updates',
      'Time Deposits',
      'Dormant Accounts',
      'Credit Cards',
      'Others',
    ],
  },
] as const;

export function serviceByName(name: string): CvmService {
  const service = SERVICE_CATALOG.find((s) => s.name === name);
  if (!service) throw new Error(`Unknown CVM service: "${name}"`);
  return service;
}
