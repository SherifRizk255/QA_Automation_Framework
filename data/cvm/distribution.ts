/**
 * Deterministic customer → service/sub-service distribution (brief §11).
 *
 * Strategy: flatten every (mainService × subService) combination into an ordered
 * list, then assign customers round-robin (combo[i % combos.length]). Predictable,
 * broad coverage, and cycles cleanly when customerCount exceeds the combo count.
 * No uncontrolled randomness — the only random value is the throwaway mobile number.
 */
import { SERVICE_CATALOG, type AgentRole } from './serviceCatalog';

/** One valid kiosk path a customer can take. */
export interface ServicePath {
  readonly mainService: string;
  readonly subService: string;
  readonly agentRole: AgentRole;
  readonly ticketPrefix: string;
}

/** The full customer record — correlation backbone across both portals (brief §12). */
export interface CustomerJourney {
  readonly customerIndex: number;
  readonly mainService: string;
  readonly subService: string;
  readonly agentRole: AgentRole;
  readonly ticketPrefix: string;
  /** Random mobile entered on the kiosk keypad (011-format not required; "010" + 8 digits). */
  mobileNumber: string;
  /** Ticket number issued by the kiosk, e.g. "T-514" — filled after ticket generation. */
  ticketNumber?: string;
  /** "Issued at" timestamp shown on the kiosk ticket screen. */
  issuedAt?: string;
  /** Set true once the Agent Portal has completed serving this ticket. */
  served?: boolean;
}

/**
 * Flatten the catalog into every (service × sub-service) combination.
 *
 * Ordering is INTERLEAVED across services (column-major): the first customers
 * get different services in rotation — customer 1 → Tellers, 2 → Operations,
 * 3 → Customer Services, 4 → Tellers… — so even a small customerCount exercises
 * all three agent portals (brief §8). Still fully deterministic.
 *
 * (For strict service-grouped ordering per §11, replace the loop with a simple
 * `SERVICE_CATALOG.flatMap(...)` over each service's sub-services.)
 */
export function flattenServicePaths(): ServicePath[] {
  const maxSubServices = Math.max(...SERVICE_CATALOG.map((s) => s.subServices.length));
  const paths: ServicePath[] = [];
  for (let column = 0; column < maxSubServices; column++) {
    for (const service of SERVICE_CATALOG) {
      const subService = service.subServices[column];
      if (subService === undefined) continue;
      paths.push({
        mainService: service.name,
        subService,
        agentRole: service.agentRole,
        ticketPrefix: service.ticketPrefix,
      });
    }
  }
  return paths;
}

/** Generate a throwaway Egyptian-format mobile number ("010" + 8 random digits). */
export function randomMobileNumber(): string {
  return '010' + Math.floor(10_000_000 + Math.random() * 89_999_999).toString();
}

/**
 * Build `count` customer journeys, round-robin over the flattened paths.
 * Cycles through the combinations again when count exceeds the number of combos.
 */
export function buildCustomerJourneys(count: number): CustomerJourney[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`CVM customerCount must be a positive integer, got: ${count}`);
  }
  const paths = flattenServicePaths();
  return Array.from({ length: count }, (_, index) => {
    const path = paths[index % paths.length];
    return {
      customerIndex: index + 1,
      mainService: path.mainService,
      subService: path.subService,
      agentRole: path.agentRole,
      ticketPrefix: path.ticketPrefix,
      mobileNumber: randomMobileNumber(),
    };
  });
}
