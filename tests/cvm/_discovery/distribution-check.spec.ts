import { test, expect } from '@playwright/test';
import { buildCustomerJourneys, flattenServicePaths } from '../../../data/cvm/distribution';

test('distribution — round-robin coverage across service/sub-service combos', () => {
  const paths = flattenServicePaths();
  expect(paths.length).toBe(4 + 5 + 8); // Tellers + Operations + Customer Services

  const journeys = buildCustomerJourneys(8);
  expect(journeys).toHaveLength(8);
  for (const j of journeys) {
    console.log(`#${j.customerIndex}  ${j.mainService} → ${j.subService}  [${j.ticketPrefix}- / ${j.agentRole}]  mobile ${j.mobileNumber}`);
    expect(j.mobileNumber).toMatch(/^010\d{8}$/);
  }
  // First 8 must be the first 8 distinct combos (deterministic, no repeats yet).
  const combos = journeys.map((j) => `${j.mainService}|${j.subService}`);
  expect(new Set(combos).size).toBe(8);

  // Cycling: 18 customers over 17 combos → #18 reuses combo #1.
  const cycled = buildCustomerJourneys(18);
  expect(cycled[17].mainService).toBe(cycled[0].mainService);
  expect(cycled[17].subService).toBe(cycled[0].subService);
});
