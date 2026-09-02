import { test, expect } from '../../../fixtures/frameworkFixtures';
import { PageObjectManager } from '../../../pages/PageObjectManager';
import { CVM } from '../../../config/resources';
import { buildCustomerJourneys } from '../../../data/cvm/distribution';
import type { AgentRole } from '../../../data/cvm/serviceCatalog';
import { logWindowSize, maximizeWindow } from '../../../utils/browserWindow';

/**
 * The complete CVM multi-portal business cycle in a SINGLE test case:
 *
 *  Phase 1 — for each configured customer, the Kiosk (one desk session) issues a
 *            queue ticket across distinct service/sub-service paths, and we then
 *            immediately verify that ticket ARRIVED in its service's Agent Portal.
 *  Phase 2 — once every ticket is created, the agents serve round-robin (one
 *            ticket from each service in turn) until ALL agent queues are empty,
 *            each served ticket correlated back to the customer that created it.
 *
 * customerCount is configured centrally (CVM.customerCount / CVM_CUSTOMER_COUNT).
 * Rebuilt from the legacy Robot Framework `cvm_multi_portal_cycle`.
 */
test.describe('CVM Multi-Portal Cycle @cvm @e2e @multi-portal @positive', () => {
  test(
    'TC-CVM-001 | Multi-portal CVM cycle — customers take kiosk tickets across services & sub-services; each ticket is verified to arrive in the correct Agent Portal, then served round-robin until every queue is empty with full ticket/service/sub-service correlation',
    async ({ browser }, testInfo) => {
      const journeys = buildCustomerJourneys(CVM.customerCount);
      test.setTimeout(180_000 + journeys.length * 90_000);

      // Kiosk: one desk session reused for every customer.
      const kioskContext = await browser.newContext({ viewport: null });
      const kioskPage = await kioskContext.newPage();
      await maximizeWindow(kioskPage);
      await logWindowSize('CVM kiosk', kioskPage);
      const kiosk = new PageObjectManager(kioskPage);
      await kiosk.kioskLoginPage.goto();
      await kiosk.kioskLoginPage.login(CVM.desk.username, CVM.desk.password);

      // Agent portals: one isolated context per service-role, opened lazily and
      // retired as soon as its queue and test-created workload are both complete.
      const agents = new Map<AgentRole, PageObjectManager>();
      const ensureAgent = async (role: AgentRole): Promise<PageObjectManager> => {
        const existing = agents.get(role);
        if (existing) return existing;
        const context = await browser.newContext({ viewport: null });
        const agentPage = await context.newPage();
        await maximizeWindow(agentPage);
        await logWindowSize(`CVM agent ${role}`, agentPage);
        const agent = new PageObjectManager(agentPage);
        await agent.agentLoginPage.goto();
        await agent.agentLoginPage.login(CVM.agents[role].username, CVM.agents[role].password);
        agents.set(role, agent);
        return agent;
      };

      // ── Phase 1 — create each ticket and verify it reached the agent queue ──
      for (const journey of journeys) {
        const ticket = await kiosk.kioskJourneyPage.takeTicket(journey);
        journey.ticketNumber = ticket.number;
        journey.ticketServiceName = ticket.serviceName;

        const agent = await ensureAgent(journey.agentRole);
        await agent.agentQueuePage.waitForTicketQueued(ticket.number);

        testInfo.annotations.push({
          type: 'kiosk→agent',
          description: `#${journey.customerIndex} [${journey.customerType}/${journey.segment}] ${journey.mainService} → ${journey.subService} = ${ticket.number} ✓ arrived @ ${journey.agentRole}`,
        });
      }

      expect(new Set(journeys.map((j) => j.ticketNumber)).size, 'every customer received a unique ticket').toBe(
        journeys.length,
      );

      // ── Phase 2 — round-robin serve one ticket per service until all empty ──
      const journeyByTicket = new Map(journeys.map((j) => [j.ticketNumber!, j]));
      const activeRoles = new Set(agents.keys());
      const maxRounds = journeys.length * 6 + 60; // ample headroom incl. draining leftover demo tickets
      const hasUnservedCreatedTickets = (role: AgentRole) =>
        journeys.some((journey) => journey.agentRole === role && !journey.served);

      const closeAgentIfFinished = async (role: AgentRole): Promise<boolean> => {
        if (hasUnservedCreatedTickets(role)) return false;
        const agent = agents.get(role)!;
        if (!(await agent.agentQueuePage.isQueueExhausted())) return false;

        await agent.page.context().close();
        activeRoles.delete(role);
        testInfo.annotations.push({
          type: 'agent-retired',
          description: `${role} closed after all created tickets were served and no upcoming tickets remained`,
        });
        return true;
      };

      for (let round = 0; round < maxRounds; round++) {
        let anyServed = false;
        for (const role of [...activeRoles]) {
          const queue = agents.get(role)!.agentQueuePage;
          const served = await queue.serveOneTicket((ticketNumber) => journeyByTicket.get(ticketNumber)?.subService);
          if (served) {
            anyServed = true;
            const journey = journeyByTicket.get(served);
            if (journey) journey.served = true;
          }
          await closeAgentIfFinished(role);
        }
        if (activeRoles.size === 0) break;
        if (!anyServed) break;
      }

      // ── Final — no customer lost or mixed up ──
      for (const journey of journeys) {
        expect(
          journey.served,
          `customer #${journey.customerIndex} ticket ${journey.ticketNumber} (${journey.mainService} → ${journey.subService}) was served`,
        ).toBe(true);
      }

      for (const role of activeRoles) await agents.get(role)!.page.context().close();
      await kioskContext.close();
    },
  );
});
