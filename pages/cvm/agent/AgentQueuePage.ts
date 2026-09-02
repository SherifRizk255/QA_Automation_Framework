import { expect, type Page } from '@playwright/test';
import { SERVICE_CATALOG } from '../../../data/cvm/serviceCatalog';

/**
 * KFH CVM Agent Portal — serving home (#/app-home).
 *
 * Provides the primitives the multi-portal spec orchestrates:
 *  - waitForTicketQueued() — confirm a kiosk ticket arrived in this queue (brief §13/§17)
 *  - hasTickets() / serveOneTicket() — round-robin "one per service until empty" serving
 * FIFO queue; PrimeNG confirm/alert dialogs are handled explicitly. KFH completes
 * a service by writing a free-text summary note (no sub-service multiselect).
 */
export class AgentQueuePage {
  constructor(private readonly page: Page) {}

  // ─── Queue state (read from the home dashboard) ──────────────────────────

  private ticketAfter(body: string, label: string): string | null {
    const match = body.match(new RegExp(`${label}[\\s\\S]*?Ticket Number\\s*([^\\r\\n]+)`, 'i'));
    const token = match?.[1]?.trim() ?? '';
    return /^[A-Z]-\d+$/.test(token) ? token : null;
  }

  private async readQueueState(): Promise<{ current: string | null; next: string | null }> {
    const body = await this.page.locator('body').innerText();
    return {
      current: this.ticketAfter(body, 'Current Ticket'),
      next: this.ticketAfter(body, 'Next Serving'),
    };
  }

  /** Ticket number currently being served, or null ("No tickets to serve"). */
  async readCurrentTicket(): Promise<string | null> {
    return (await this.readQueueState()).current;
  }

  /** Next ticket waiting in the queue, or null when the queue is empty. */
  async readNextServing(): Promise<string | null> {
    return (await this.readQueueState()).next;
  }

  /**
   * Wait until the serving home has actually rendered its queue state — a ticket
   * number in Current/Next, or an explicit empty indicator. Guards against reading
   * the dashboard before it populates (e.g. immediately after login).
   */
  private async waitForHomeReady(): Promise<void> {
    await expect
      .poll(
        async () => {
          const { current, next } = await this.readQueueState();
          if (current !== null || next !== null) return true;
          const body = await this.page.locator('body').innerText().catch(() => '');
          return /No up ?coming tickets to serve/i.test(body) || /No tickets to serve/i.test(body);
        },
        { timeout: 15_000, intervals: [400, 800, 1_500] },
      )
      .toBe(true);
  }

  /** True while this agent still has a current or upcoming ticket. */
  async hasTickets(): Promise<boolean> {
    await this.waitForHomeReady();
    const queue = await this.readQueueState();
    return queue.current !== null || queue.next !== null;
  }

  /** True when the dashboard explicitly shows no upcoming or current customer. */
  async isQueueExhausted(): Promise<boolean> {
    const noUpcoming = this.page.getByText(/No up ?coming tickets to serve/i);
    return (
      (await this.readCurrentTicket()) === null &&
      (await noUpcoming.first().isVisible().catch(() => false))
    );
  }

  // ─── "Customers In Queue" list (arrival verification) ────────────────────

  private queueDialog() {
    return this.page.locator('.p-dialog').filter({ hasText: /Customers In Queue/i });
  }

  /** Open the queue list. Returns false (without blocking) if there's no list button. */
  private async openQueueList(): Promise<boolean> {
    if (await this.queueDialog().isVisible().catch(() => false)) return true;
    const button = this.page.getByRole('button', { name: /customers in queue/i });
    // The "Customers In Queue" button only exists while there are upcoming tickets.
    if ((await button.count()) === 0) return false;
    await this.dismissConfirm(); // clear any Alert modal blocking the button
    await button.first().click({ timeout: 5_000 }).catch(() => {});
    return this.queueDialog().waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
  }

  private async closeQueueList(): Promise<void> {
    const dialog = this.queueDialog();
    if (!(await dialog.isVisible().catch(() => false))) return;
    await dialog.locator('.p-dialog-header-icon, .p-dialog-header-close').first().click({ timeout: 3_000 }).catch(() => {});
    await dialog.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
  }

  /** True if the ticket is currently served, next up, or listed in the queue. */
  async isTicketInQueue(ticketNumber: string): Promise<boolean> {
    const { current, next } = await this.readQueueState();
    if (current === ticketNumber || next === ticketNumber) return true;
    if (!(await this.openQueueList())) return false;
    const text = await this.queueDialog().innerText().catch(() => '');
    await this.closeQueueList();
    return new RegExp(`\\b${ticketNumber}\\b`).test(text);
  }

  /** Poll until the given kiosk ticket has arrived in this agent's queue. */
  async waitForTicketQueued(ticketNumber: string): Promise<void> {
    await expect
      .poll(() => this.isTicketInQueue(ticketNumber), { timeout: 45_000, intervals: [1_000, 2_000, 3_000] })
      .toBe(true);
  }

  // ─── Serving ─────────────────────────────────────────────────────────────

  /** Dismiss a PrimeNG confirm/alert dialog if one is blocking (Alert / "Forbbiden Action"). */
  private async dismissConfirm(): Promise<void> {
    const accept = this.page.locator('.p-confirm-dialog-accept');
    if (await accept.count()) await accept.first().click().catch(() => {});
  }

  /** Call the next customer (FIFO) and wait until it becomes the current ticket. */
  async callNextCustomer(): Promise<void> {
    await this.dismissConfirm();
    await this.page.getByRole('button', { name: 'Next', exact: true }).click();
    await this.dismissConfirm();
    await expect
      .poll(() => this.readCurrentTicket(), { timeout: 20_000, intervals: [500, 1_000, 2_000] })
      .not.toBeNull();
  }

  /**
   * Complete the current customer (KFH): Ticket Served → "Done" card →
   * "Summary of services" dialog → write a notes summary → Confirm.
   */
  async completeService(note = 'Automation Test'): Promise<void> {
    await this.page.getByRole('button', { name: 'Ticket Served', exact: true }).click();

    // "Done / Routing" dialog — Done is a clickable card, not a <button>.
    const doneRouting = this.page.locator('.p-dialog').filter({ hasText: /Routing/ });
    await doneRouting.getByText('Done', { exact: true }).click();

    // "Summary of services" dialog — type the notes summary, then Confirm.
    const summary = this.page.locator('.p-dialog').filter({ hasText: /Summary of services/i });
    await expect(summary).toBeVisible({ timeout: 20_000 });
    const notes = summary.getByPlaceholder('Add notes here');
    await notes.fill(note);
    const confirmButton = summary.getByRole('button', { name: 'Confirm', exact: true });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();
    await this.dismissConfirm(); // accept any success confirmation
    await expect(summary).toBeHidden({ timeout: 20_000 });
  }

  private defaultSubServiceFor(ticketNumber: string): string {
    const prefix = ticketNumber.split('-')[0];
    return SERVICE_CATALOG.find((s) => s.ticketPrefix === prefix)?.subServices[0] ?? 'Others';
  }

  /**
   * Serve exactly one ticket from this queue and return its number, or null if
   * the queue is empty. `resolveSubService` supplies the sub-service to confirm
   * for a given ticket number (falls back to a valid default for foreign tickets).
   */
  async serveOneTicket(resolveSubService: (ticketNumber: string) => string | undefined): Promise<string | null> {
    await this.dismissConfirm();
    await this.waitForHomeReady();
    const queue = await this.readQueueState();
    let current = queue.current;
    if (!current) {
      if (queue.next === null) return null;
      await this.callNextCustomer();
      current = await this.readCurrentTicket();
    }
    if (!current) return null;
    const subService = resolveSubService(current) ?? this.defaultSubServiceFor(current);
    await this.completeService(`Automation Test - ${subService}`);
    return current;
  }
}
