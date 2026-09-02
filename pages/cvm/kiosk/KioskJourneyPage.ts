import { expect, type Page } from '@playwright/test';
import type { CustomerJourney } from '../../../data/cvm/distribution';

export interface IssuedTicket {
  /** e.g. "T-501" — service-prefixed queue number. */
  number: string;
  /** "Service Name" shown on the ticket screen (correlation cross-check). */
  serviceName?: string;
}

/**
 * KFH CVM Kiosk Portal — the per-customer "take a ticket" journey.
 *
 * KFH adds four Customer-Details screens vs ABK (customer type, segment, ticket
 * type, identification method), the sub-service is a single-click card that
 * auto-generates the ticket, and the kiosk auto-returns to the language screen
 * after each ticket (docs/analysis/kfh-kiosk-walkthrough.md). Reusable steps
 * (brief §16) plus a composite `takeTicket()`.
 */
export class KioskJourneyPage {
  constructor(private readonly page: Page) {}

  private button(name: string) {
    return this.page.getByRole('button', { name, exact: true });
  }
  private card(text: string) {
    return this.page.getByText(text, { exact: true }).first();
  }

  /** Language screen → English → Customer/Non-Customer screen. */
  async startCustomerJourney(): Promise<void> {
    await this.page.getByRole('button', { name: /english/i }).click();
    await expect(this.button('Non-Customer')).toBeVisible({ timeout: 20_000 });
  }

  /** Customer / Non-Customer → Segment screen. */
  async selectCustomerType(customerType: string): Promise<void> {
    await this.button(customerType).click();
    await expect(this.button('Corporate')).toBeVisible({ timeout: 15_000 });
  }

  /** Segment → Ticket-type screen. */
  async selectSegment(segment: string): Promise<void> {
    await this.button(segment).click();
    await expect(this.button('New ticket')).toBeVisible({ timeout: 15_000 });
  }

  /** Ticket type (always "New ticket"). Next is either the ID-method screen (Customer) or the keypad (Non-Customer). */
  async selectTicketType(): Promise<void> {
    await this.button('New ticket').click();
    await expect(async () => {
      const idScreen = await this.card('National ID').isVisible().catch(() => false);
      const keypad = await this.button('1').isVisible().catch(() => false);
      expect(idScreen || keypad).toBe(true);
    }).toPass({ timeout: 15_000, intervals: [400, 800] });
  }

  /**
   * Identification method → mobile keypad. KFH only shows the "Mobile Number /
   * National ID" choice for Customers; Non-Customers go straight to the keypad.
   * Always continue with Mobile Number, then wait for the keypad.
   */
  async selectIdentificationMethod(): Promise<void> {
    const mobileCard = this.card('Mobile Number');
    if (await mobileCard.isVisible().catch(() => false)) {
      await mobileCard.click();
    }
    await expect(this.button('1')).toBeVisible({ timeout: 15_000 });
  }

  /** Enter the mobile number on the on-screen keypad and continue → Select Service. */
  async enterMobileNumber(mobileNumber: string): Promise<void> {
    for (const digit of mobileNumber) {
      await this.button(digit).first().click();
    }
    await this.button('Next').click();
    await expect(this.button('Tellers')).toBeVisible({ timeout: 20_000 });
  }

  /** Select the main service (a wait-time modal is handled in selectSubService). */
  async selectMainService(service: string): Promise<void> {
    await this.button(service).click();
  }

  /**
   * Select the sub-service card (single click → ticket). Transparently accepts the
   * KFH "expected waiting time" modal (Cancel/Proceed) that may appear first.
   */
  async selectSubService(subService: string): Promise<void> {
    const proceed = this.button('Proceed');
    const target = this.card(subService);

    // Either a wait-time modal is up (→ Proceed) or the sub-service screen is ready.
    // Use instant isVisible() checks so the loop actually retries and dismisses the
    // modal (a nested expect().toBeVisible() would block the whole budget).
    await expect(async () => {
      if (await proceed.isVisible().catch(() => false)) await proceed.click().catch(() => {});
      expect(await target.isVisible().catch(() => false)).toBe(true);
    }).toPass({ timeout: 20_000, intervals: [500, 800, 1_200] });

    await target.click();
    await expect(this.page.getByText(/Ticket Number/i)).toBeVisible({ timeout: 30_000 });
  }

  /** Read the issued ticket from the ticket screen. */
  async readTicket(): Promise<IssuedTicket> {
    await expect(this.page.getByText(/Ticket Number/i)).toBeVisible({ timeout: 30_000 });
    const body = await this.page.locator('body').innerText();
    const number = body.match(/\b([A-Z]-\d+)\b/)?.[1];
    if (!number) throw new Error('KFH kiosk ticket number not found on the ticket screen');
    const serviceName = body.match(/Service Name\s*[\r\n]+\s*([^\r\n]+)/i)?.[1]?.trim();
    return { number, serviceName };
  }

  /** Wait for the kiosk to auto-return to the language screen (per-customer reset). */
  async waitForReset(): Promise<void> {
    await expect(this.page.getByText('Please Select Language')).toBeVisible({ timeout: 40_000 });
  }

  /**
   * Run the full journey for one customer and return the issued ticket.
   * Cross-checks the ticket's Service Name against the expected service.
   */
  async takeTicket(journey: CustomerJourney): Promise<IssuedTicket> {
    await this.startCustomerJourney();
    await this.selectCustomerType(journey.customerType);
    await this.selectSegment(journey.segment);
    await this.selectTicketType();
    await this.selectIdentificationMethod();
    await this.enterMobileNumber(journey.mobileNumber);
    await this.selectMainService(journey.mainService);
    await this.selectSubService(journey.subService);
    const ticket = await this.readTicket();
    if (ticket.serviceName) {
      expect(ticket.serviceName, `ticket ${ticket.number} service should be ${journey.mainService}`).toBe(
        journey.mainService,
      );
    }
    await this.waitForReset();
    return ticket;
  }
}
