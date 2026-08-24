import { expect, type Page } from '@playwright/test';
import type { CustomerJourney } from '../../../data/cvm/distribution';

export interface IssuedTicket {
  /** e.g. "T-514" — service-prefixed queue number. */
  number: string;
  /** "Issued at" value shown on the ticket screen, if present. */
  issuedAt?: string;
}

/**
 * CVM Kiosk Portal — the per-customer "take a ticket" journey.
 * Reusable steps (brief §16) plus a composite `takeTicket()` that runs the whole
 * flow and returns the issued ticket. The kiosk resets to the language screen
 * after each ticket, so this page object is called once per simulated customer.
 */
export class KioskJourneyPage {
  constructor(private readonly page: Page) {}

  private button(name: string) {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** Language screen → English → mobile-number screen. */
  async startCustomerJourney(): Promise<void> {
    await this.page.getByRole('button', { name: /english/i }).click();
    await expect(this.page.getByRole('heading', { name: /enter your mobile number/i })).toBeVisible({
      timeout: 20_000,
    });
  }

  /** Enter the mobile number on the on-screen keypad and continue. */
  async enterMobileNumber(mobileNumber: string): Promise<void> {
    for (const digit of mobileNumber) {
      await this.button(digit).first().click();
    }
    await this.button('Next').click();
    await expect(this.page.getByRole('heading', { name: /select a service/i })).toBeVisible({
      timeout: 20_000,
    });
  }

  /** Select the main service → sub-service screen. */
  async selectMainService(service: string): Promise<void> {
    await this.button(service).click();
    await expect(this.page.getByRole('heading', { name: /select your sub-services/i })).toBeVisible({
      timeout: 20_000,
    });
  }

  /** Select one or more sub-services (multi-select) and continue. */
  async selectSubServices(subServices: string[]): Promise<void> {
    for (const subService of subServices) {
      await this.button(subService).click();
    }
    await this.button('Continue').click();
  }

  /** Choose the printed-ticket delivery (avoids sending an SMS) → summary screen. */
  async choosePrintedTicket(): Promise<void> {
    await this.button('Printed ticket').click();
    await expect(this.button('Confirm')).toBeVisible({ timeout: 20_000 });
  }

  /** Confirm the summary → generate the ticket, and read the issued ticket. */
  async generateTicket(): Promise<IssuedTicket> {
    await this.button('Confirm').click();
    await expect(this.page.getByText(/Your Number/i)).toBeVisible({ timeout: 30_000 });

    const body = await this.page.locator('body').innerText();
    const number = body.match(/\b([A-Z]-\d+)\b/)?.[1];
    if (!number) throw new Error('Kiosk ticket number not found on the ticket screen');
    const issuedAt = body.match(/Issued at\s*[\r\n]*\s*([^\r\n]+)/i)?.[1]?.trim();
    return { number, issuedAt };
  }

  /** Return to the language screen so the next customer can start. */
  async returnToMainMenu(): Promise<void> {
    await this.button('Main Menu').click();
    await expect(this.page.getByRole('heading', { name: /select your language/i })).toBeVisible({
      timeout: 20_000,
    });
  }

  /**
   * Run the full journey for one customer and return the issued ticket.
   * Asserts the ticket prefix matches the expected service prefix (correlation).
   */
  async takeTicket(journey: CustomerJourney): Promise<IssuedTicket> {
    await this.startCustomerJourney();
    await this.enterMobileNumber(journey.mobileNumber);
    await this.selectMainService(journey.mainService);
    await this.selectSubServices([journey.subService]);
    await this.choosePrintedTicket();
    const ticket = await this.generateTicket();
    expect(ticket.number, `ticket ${ticket.number} should carry the ${journey.ticketPrefix}- prefix`).toMatch(
      new RegExp(`^${journey.ticketPrefix}-\\d+$`),
    );
    await this.returnToMainMenu();
    return ticket;
  }
}
