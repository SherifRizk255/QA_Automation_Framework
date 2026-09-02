/**
 * Deterministic customer distribution for KFH CVM.
 *
 * Each customer gets a (service × sub-service) combination round-robin over the
 * flattened, service-interleaved catalog, PLUS an independently rotated customer
 * type and segment. Everything is deterministic and reproducible — the only
 * random value is the throwaway mobile number.
 */
import {
  SERVICE_CATALOG,
  CUSTOMER_TYPES,
  SEGMENTS,
  type AgentRole,
  type CustomerType,
  type Segment,
} from './serviceCatalog';

/** Ticket type is fixed for this scenario (brief §11). */
export const TICKET_TYPE = 'New ticket' as const;
/** Identification method is fixed for this scenario (brief §12). */
export const IDENTIFICATION_METHOD = 'Mobile Number' as const;

/** One valid kiosk service path a customer can take. */
export interface ServicePath {
  readonly mainService: string;
  readonly subService: string;
  readonly agentRole: AgentRole;
  readonly ticketPrefix: string;
}

/** The full customer record — correlation backbone across both portals (brief §12/§16). */
export interface CustomerJourney {
  readonly customerIndex: number;
  readonly customerType: CustomerType;
  readonly segment: Segment;
  readonly ticketType: string;
  readonly identificationMethod: string;
  readonly mainService: string;
  readonly subService: string;
  readonly agentRole: AgentRole;
  readonly ticketPrefix: string;
  /** Random mobile entered on the kiosk keypad ("010" + 8 digits). */
  mobileNumber: string;
  /** Ticket number issued by the kiosk, e.g. "T-501" — filled after generation. */
  ticketNumber?: string;
  /** "Service Name" shown on the kiosk ticket screen — correlation cross-check. */
  ticketServiceName?: string;
  /** Set true once the Agent Portal has completed serving this ticket. */
  served?: boolean;
}

/**
 * Flatten the catalog into every (service × sub-service) combination, INTERLEAVED
 * across services (column-major) so even a small customerCount hits all agents.
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
 * Build `count` customer journeys. Service/sub-service round-robins over the
 * flattened paths; customer type and segment rotate independently so consecutive
 * customers differ on every dimension (brief §14/§15). Cycles cleanly on overflow.
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
      customerType: CUSTOMER_TYPES[index % CUSTOMER_TYPES.length],
      segment: SEGMENTS[index % SEGMENTS.length],
      ticketType: TICKET_TYPE,
      identificationMethod: IDENTIFICATION_METHOD,
      mainService: path.mainService,
      subService: path.subService,
      agentRole: path.agentRole,
      ticketPrefix: path.ticketPrefix,
      mobileNumber: randomMobileNumber(),
    };
  });
}
