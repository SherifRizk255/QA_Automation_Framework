import { expect, type Page } from '@playwright/test';
import { SERVICE_CATALOG } from '../../../data/cvm/serviceCatalog';
import { LocatorRepository } from '../../../utils/locatorRepository';

/**
 * CVM Agent Portal — serving home (#/app-home).
 *
 * Provides the primitives the multi-portal spec orchestrates:
 *  - waitForTicketQueued() — confirm a kiosk ticket arrived in this queue (brief §13/§17)
 *  - hasTickets() / serveOneTicket() — round-robin "one per service until empty" serving
 * FIFO queue; PrimeNG confirm/alert dialogs are handled explicitly.
 */
export class AgentQueuePage {
  private readonly repository: LocatorRepository;

  constructor(private readonly page: Page) {
    this.repository = new LocatorRepository(page);
  }

  // ─── Queue state (read from the home dashboard) ──────────────────────────

  private async ticketAfter(label: string): Promise<string | null> {
    const body = await this.page.locator('body').innerText();
    const match = body.match(new RegExp(`${label}[\\s\\S]*?Ticket Number\\s*([^\\r\\n]+)`, 'i'));
    const token = match?.[1]?.trim() ?? '';
    return /^[A-Z]-\d+$/.test(token) ? token : null;
  }

  /** Ticket number currently being served, or null ("No tickets to serve"). */
  readCurrentTicket(): Promise<string | null> {
    return this.ticketAfter('Current Ticket');
  }

  /** Next ticket waiting in the queue, or null when the queue is empty. */
  readNextServing(): Promise<string | null> {
    return this.ticketAfter('Next Serving');
  }

  /** True while this agent still has a current or upcoming ticket. */
  async hasTickets(): Promise<boolean> {
    return (await this.readCurrentTicket()) !== null || (await this.readNextServing()) !== null;
  }

  // ─── "Customers In Queue" list (arrival verification) ────────────────────

  private queueDialog() {
    return this.page.locator('.p-dialog').filter({ hasText: /Customers In Queue/i });
  }

  private async openQueueList(): Promise<void> {
    if (await this.queueDialog().isVisible().catch(() => false)) return;
    await this.dismissConfirm(); // clear any Alert modal blocking the button
    await this.page.getByRole('button', { name: /customers in queue/i }).first().click();
    await this.queueDialog().waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
  }

  private async closeQueueList(): Promise<void> {
    const dialog = this.queueDialog();
    if (!(await dialog.isVisible().catch(() => false))) return;
    await dialog.locator('.p-dialog-header-close').first().click().catch(() => {});
    await dialog.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
  }

  /** True if the ticket is currently served, next up, or listed in the queue. */
  async isTicketInQueue(ticketNumber: string): Promise<boolean> {
    if ((await this.readCurrentTicket()) === ticketNumber) return true;
    if ((await this.readNextServing()) === ticketNumber) return true;
    await this.openQueueList();
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
   * Complete the current customer: Ticket Served → "Done" → confirm the served
   * sub-service in the "summary of services" dialog → Confirm.
   */
  async completeService(subService: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Ticket Served', exact: true }).click();

    // "Done / Routing" dialog — Done is a clickable card, not a <button>.
    const doneRouting = this.page.locator('.p-dialog').filter({ hasText: /Routing/ });
    await doneRouting.getByText('Done', { exact: true }).click();

    // "summary of services" dialog — pick the served sub-service, then Confirm.
    const summary = this.page.locator('.p-dialog').filter({ hasText: /summary of services/i });
    const subServiceSelectTrigger = summary.getByText('Select Sub-Services', { exact: true });
    await expect(subServiceSelectTrigger).toHaveCount(1);
    await expect(subServiceSelectTrigger).toBeVisible();
    await expect(subServiceSelectTrigger).toBeEnabled();
    await subServiceSelectTrigger.click();

    // PrimeNG may retain hidden animation containers, so interact only with the visible panel.
    const activePanel = this.repository
      .locator('CVM_AGENT.SERVICE_SUMMARY_DROPDOWN_PANEL')
      .filter({ visible: true });
    await expect(activePanel).toHaveCount(1);
    await expect(activePanel).toBeVisible();

    const activeSubServiceOption = activePanel.locator('li').filter({ hasText: subService });
    await expect(activeSubServiceOption).toHaveCount(1);
    await expect(activeSubServiceOption).toBeVisible();

    const subServiceCheckbox = this.repository.locatorWithin(
      activeSubServiceOption,
      'CVM_AGENT.SUBSERVICE_CHECKBOX_BOX',
    );
    await expect(subServiceCheckbox).toHaveCount(1);
    await expect(subServiceCheckbox).toBeVisible();
    await expect(subServiceCheckbox).toBeEnabled();
    await subServiceCheckbox.click();
    await expect(activeSubServiceOption).toContainClass('p-highlight');

    const confirmButton = summary.getByRole('button', { name: 'Confirm', exact: true });
    await expect(confirmButton).toBeEnabled();

    const closeDropdownButton = activePanel.getByRole('button');
    await expect(closeDropdownButton).toHaveCount(1);
    await expect(closeDropdownButton).toBeVisible();
    await expect(closeDropdownButton).toBeEnabled();
    await closeDropdownButton.click();
    await expect(activePanel).toHaveCount(0);

    await confirmButton.click();
    const successConfirmButton = this.repository.locator('CVM_AGENT.SUCCESS_CONFIRM_BUTTON').filter({ visible: true });
    await expect(successConfirmButton).toHaveCount(1);
    await expect(successConfirmButton).toBeVisible();
    await expect(successConfirmButton).toBeEnabled();
    await successConfirmButton.click();
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
    let current = await this.readCurrentTicket();
    if (!current) {
      if ((await this.readNextServing()) === null) return null;
      await this.callNextCustomer();
      current = await this.readCurrentTicket();
    }
    if (!current) return null;
    await this.completeService(resolveSubService(current) ?? this.defaultSubServiceFor(current));
    return current;
  }
}
