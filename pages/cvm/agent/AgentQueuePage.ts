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

  /** True while this agent still has a current or upcoming ticket. */
  async hasTickets(): Promise<boolean> {
    const queue = await this.readQueueState();
    return queue.current !== null || queue.next !== null;
  }

  /** True when the dashboard explicitly shows no upcoming or current customer. */
  async isQueueExhausted(): Promise<boolean> {
    const noUpcomingTickets = this.page.getByText('No up coming tickets to serve', { exact: true });
    return (
      (await this.readCurrentTicket()) === null &&
      (await noUpcomingTickets.isVisible().catch(() => false))
    );
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

    await this.confirmServedSubService(subService);
  }

  /** Select the completed sub-service and accept both confirmation steps. */
  async confirmServedSubService(subService: string): Promise<void> {
    const summary = this.page.locator('.p-dialog').filter({ hasText: /summary of services/i });
    const activePanel = this.repository
      .locator('CVM_AGENT.SERVICE_SUMMARY_DROPDOWN_PANEL')
      .filter({ visible: true });
    const dropdownTrigger = this.repository.locatorWithin(
      summary,
      'CVM_AGENT.SERVICE_SUMMARY_DROPDOWN_TRIGGER',
    );
    const selectedSubServiceToken = this.repository
      .locatorWithin(summary, 'CVM_AGENT.SELECTED_SUBSERVICE_TOKEN')
      .filter({ hasText: subService });
    const confirmButton = summary.getByRole('button', { name: 'Confirm', exact: true });

    await expect(summary).toBeVisible();
    await expect(dropdownTrigger).toHaveCount(1);
    await expect(dropdownTrigger).toBeVisible();

    let selectionConfirmed = false;
    const maximumSelectionAttempts = 3;

    for (let attempt = 1; attempt <= maximumSelectionAttempts; attempt++) {
      // Reset any stale or duplicated overlay before each bounded attempt.
      if ((await activePanel.count()) > 0) {
        await dropdownTrigger.click();
        await expect(activePanel).toHaveCount(0);
      }

      await dropdownTrigger.click();
      await expect(activePanel).toHaveCount(1);
      await expect(activePanel).toBeVisible();

      const matchingSubServiceOptions = activePanel.getByRole('listitem', {
        name: subService,
        exact: true,
      });

      // The application exposes two indistinguishable "Others" entries. Both
      // represent the same expected business label, so use one exact visible match.
      const activeSubServiceOption = matchingSubServiceOptions.first();
      await expect(activeSubServiceOption).toHaveCount(1);
      await expect(activeSubServiceOption).toBeVisible();

      const subServiceCheckbox = this.repository.locatorWithin(
        activeSubServiceOption,
        'CVM_AGENT.SUBSERVICE_CHECKBOX_BOX',
      );
      await expect(subServiceCheckbox).toHaveCount(1);
      await expect(subServiceCheckbox).toBeVisible();
      await expect(subServiceCheckbox).toBeEnabled();

      // PrimeNG can discard repeated checkbox events under load, so retry with
      // distinct accessible interactions instead of repeating the same click.
      if (attempt === 1) {
        await subServiceCheckbox.click({ trial: true });
        await subServiceCheckbox.click();
      } else if (attempt === 2) {
        await activeSubServiceOption.click({ trial: true });
        await activeSubServiceOption.click();
      } else {
        await activeSubServiceOption.focus();
        await expect(activeSubServiceOption).toBeFocused();
        await activeSubServiceOption.press('Enter');
      }

      try {
        await expect
          .poll(
            async () =>
              (await selectedSubServiceToken.isVisible().catch(() => false)) &&
              (await confirmButton.isEnabled().catch(() => false)),
            { timeout: 5_000, intervals: [250, 500, 1_000] },
          )
          .toBe(true);
        selectionConfirmed = true;
        break;
      } catch {
        // Retry only when the application still shows no selected token or enabled Confirm.
      }
    }

    expect(selectionConfirmed, `sub-service "${subService}" was not selected after retries`).toBe(true);
    await expect(selectedSubServiceToken).toHaveCount(1);
    await expect(selectedSubServiceToken).toBeVisible();
    await expect(confirmButton).toBeEnabled();

    // Prefer confirming immediately; collapse the overlay only when it blocks the button.
    const confirmIsActionable = await confirmButton
      .click({ trial: true, timeout: 3_000 })
      .then(() => true)
      .catch(() => false);
    if (!confirmIsActionable && (await activePanel.count()) > 0) {
      await dropdownTrigger.click();
      await expect(activePanel).toHaveCount(0);
    }
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
    const queue = await this.readQueueState();
    let current = queue.current;
    if (!current) {
      if (queue.next === null) return null;
      await this.callNextCustomer();
      current = await this.readCurrentTicket();
    }
    if (!current) return null;
    await this.completeService(resolveSubService(current) ?? this.defaultSubServiceFor(current));
    return current;
  }
}
