import { expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { test } from '../../../fixtures/portalFixtures';

/**
 * Container-list Advanced Filters regression: Search, Status, Date From/To,
 * combined criteria, and Clear.
 *
 * Every filter value is discovered from the live grid before it is applied —
 * no Tracking Number, status label, or date is hardcoded, so the suite
 * survives a dataset or release change (skill 24 / dynamic test data).
 */
test.describe('IScore Asset Management - Tagging Container List Filters', () => {
  test.beforeEach(async ({ makerTaggingPage }) => {
    await makerTaggingPage.expandContainerListFilters();
  });

  test.afterEach(async ({ makerTaggingPage }) => {
    // Return the grid to its unfiltered base state for the next case.
    await makerTaggingPage.clearContainerListFilters();
  });

  test('TC-TAG-ASSET-050 | [Positive] Searching a live Tracking Number returns that container', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Container List Filters');
    await allure.severity('critical');

    const trackingNumbers = await makerTaggingPage.readAllTrackingNumbers();
    expect(trackingNumbers.length, 'The Tagging grid needs at least one container to filter').toBeGreaterThan(0);

    const targetTrackingNumber = trackingNumbers[0];
    await makerTaggingPage.filterContainersBySearch(targetTrackingNumber);

    const filteredTrackingNumbers = await makerTaggingPage.readAllTrackingNumbers();
    expect(
      filteredTrackingNumbers,
      `Expected Search "${targetTrackingNumber}" to return only that container`
    ).toEqual([targetTrackingNumber]);
  });

  test('TC-TAG-ASSET-051 | [Negative] Searching an unknown value returns no containers', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Container List Filters');
    await allure.severity('normal');

    const unknownValue = `AUTOMATION-NOT-FOUND-${Date.now()}`;
    await makerTaggingPage.filterContainersBySearch(unknownValue);

    const rowCount = await makerTaggingPage.countContainerRows();
    expect(rowCount, `Expected Search "${unknownValue}" to match no containers`).toBe(0);
  });

  test('TC-TAG-ASSET-052 | [Positive] Filtering by a live Status returns only that status', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Container List Filters');
    await allure.severity('critical');

    const availableStatuses = await makerTaggingPage.readAvailableContainerStatuses();
    expect(availableStatuses.length, 'The Status filter should offer at least one option').toBeGreaterThan(0);
    await allure.attachment('available-statuses', availableStatuses.join(', '), 'text/plain');

    const gridStatuses = await makerTaggingPage.readAllContainerStatuses();
    const targetStatus = availableStatuses.find((status) => gridStatuses.includes(status)) ?? availableStatuses[0];

    await makerTaggingPage.filterContainersByStatus(targetStatus);

    const filteredStatuses = await makerTaggingPage.readAllContainerStatuses();
    const offending = filteredStatuses.filter((status) => status !== targetStatus);
    expect(
      offending,
      `Expected Status "${targetStatus}" to return only matching containers, but saw: ${offending.join(', ')}`
    ).toHaveLength(0);
  });

  test('TC-TAG-ASSET-053 | [Positive] Date From excludes containers created before it', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Container List Filters');
    await allure.severity('normal');

    const createdDates = await makerTaggingPage.readAllContainerCreatedDates();
    expect(createdDates.length, 'The Tagging grid needs dated containers to filter').toBeGreaterThan(0);

    const sorted = [...createdDates].sort();
    const dateFrom = sorted[sorted.length - 1];

    await makerTaggingPage.filterContainersByDateRange(dateFrom, undefined);

    const filteredDates = await makerTaggingPage.readAllContainerCreatedDates();
    const tooEarly = filteredDates.filter((date) => date < dateFrom);
    expect(
      tooEarly,
      `Expected Date From "${dateFrom}" to exclude earlier containers, but saw: ${tooEarly.join(', ')}`
    ).toHaveLength(0);
  });

  test('TC-TAG-ASSET-054 | [Positive] Date To excludes containers created after it', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Container List Filters');
    await allure.severity('normal');

    const createdDates = await makerTaggingPage.readAllContainerCreatedDates();
    expect(createdDates.length, 'The Tagging grid needs dated containers to filter').toBeGreaterThan(0);

    const sorted = [...createdDates].sort();
    const dateTo = sorted[0];

    await makerTaggingPage.filterContainersByDateRange(undefined, dateTo);

    const filteredDates = await makerTaggingPage.readAllContainerCreatedDates();
    const tooLate = filteredDates.filter((date) => date > dateTo);
    expect(
      tooLate,
      `Expected Date To "${dateTo}" to exclude later containers, but saw: ${tooLate.join(', ')}`
    ).toHaveLength(0);
  });

  test('TC-TAG-ASSET-055 | [Positive] A Date From/To range returns only containers inside it', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Container List Filters');
    await allure.severity('critical');

    const createdDates = await makerTaggingPage.readAllContainerCreatedDates();
    expect(createdDates.length, 'The Tagging grid needs dated containers to filter').toBeGreaterThan(0);

    const sorted = [...createdDates].sort();
    const dateFrom = sorted[0];
    const dateTo = sorted[sorted.length - 1];

    await makerTaggingPage.filterContainersByDateRange(dateFrom, dateTo);

    const filteredDates = await makerTaggingPage.readAllContainerCreatedDates();
    const outside = filteredDates.filter((date) => date < dateFrom || date > dateTo);
    expect(
      outside,
      `Expected range ${dateFrom}..${dateTo} to return only containers inside it, but saw: ${outside.join(', ')}`
    ).toHaveLength(0);
  });

  test('TC-TAG-ASSET-056 | [Negative] An inverted date range (From > To) returns no containers', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Container List Filters');
    await allure.severity('normal');

    const createdDates = await makerTaggingPage.readAllContainerCreatedDates();
    expect(createdDates.length, 'The Tagging grid needs dated containers to filter').toBeGreaterThan(0);

    const sorted = [...createdDates].sort();
    const earliest = sorted[0];
    const latest = sorted[sorted.length - 1];
    test.skip(earliest === latest, 'Needs at least two distinct creation dates to invert a range');

    // Deliberately inverted: From = latest, To = earliest.
    await makerTaggingPage.filterContainersByDateRange(latest, earliest);

    const rowCount = await makerTaggingPage.countContainerRows();
    expect(
      rowCount,
      `Expected the inverted range ${latest}..${earliest} to return no containers`
    ).toBe(0);
  });

  test('TC-TAG-ASSET-057 | [Positive] Search combined with Status narrows to a matching container', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Container List Filters');
    await allure.severity('critical');

    const trackingNumbers = await makerTaggingPage.readAllTrackingNumbers();
    const statuses = await makerTaggingPage.readAllContainerStatuses();
    expect(trackingNumbers.length, 'The Tagging grid needs at least one container').toBeGreaterThan(0);

    const targetTrackingNumber = trackingNumbers[0];
    const targetStatus = statuses[0];

    await makerTaggingPage.filterContainersByStatus(targetStatus);
    await makerTaggingPage.filterContainersBySearch(targetTrackingNumber);

    const filteredTrackingNumbers = await makerTaggingPage.readAllTrackingNumbers();
    const filteredStatuses = await makerTaggingPage.readAllContainerStatuses();

    expect(
      filteredTrackingNumbers,
      `Expected Search "${targetTrackingNumber}" + Status "${targetStatus}" to return that container`
    ).toEqual([targetTrackingNumber]);
    expect(filteredStatuses).toEqual([targetStatus]);
  });

  test('TC-TAG-ASSET-058 | [Positive] Clear resets every filter control and the grid', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Container List Filters');
    await allure.severity('critical');

    const baselineRowCount = await makerTaggingPage.countContainerRows();
    const trackingNumbers = await makerTaggingPage.readAllTrackingNumbers();
    expect(trackingNumbers.length, 'The Tagging grid needs at least one container').toBeGreaterThan(0);

    const createdDates = await makerTaggingPage.readAllContainerCreatedDates();
    const sorted = [...createdDates].sort();

    // Apply several filters at once so Clear has real state to reset.
    await makerTaggingPage.filterContainersByDateRange(sorted[0], sorted[sorted.length - 1]);
    await makerTaggingPage.filterContainersBySearch(trackingNumbers[0]);
    expect(await makerTaggingPage.countContainerRows()).toBeLessThanOrEqual(baselineRowCount);

    await makerTaggingPage.clearContainerListFilters();

    // The controls themselves must reset, not only the table.
    await makerTaggingPage.assertContainerListFilterControlsReset();

    const restoredRowCount = await makerTaggingPage.countContainerRows();
    expect(
      restoredRowCount,
      'Expected Clear to restore the unfiltered container list'
    ).toBe(baselineRowCount);
  });

  test('TC-TAG-ASSET-059 | [Negative] A whitespace-padded Tracking Number search behaves consistently', async ({
    makerTaggingPage,
  }) => {
    await allure.feature('IScore Asset Management');
    await allure.story('Container List Filters');
    await allure.severity('minor');

    const trackingNumbers = await makerTaggingPage.readAllTrackingNumbers();
    expect(trackingNumbers.length, 'The Tagging grid needs at least one container').toBeGreaterThan(0);

    const targetTrackingNumber = trackingNumbers[0];
    await makerTaggingPage.filterContainersBySearch(`  ${targetTrackingNumber}  `);

    const padded = await makerTaggingPage.readAllTrackingNumbers();
    await allure.attachment(
      'whitespace-search-observation',
      `padded search for "${targetTrackingNumber}" returned ${padded.length} row(s): ${padded.join(', ')}`,
      'text/plain'
    );

    // The application trims search input: a padded value must resolve to the
    // same single container as the unpadded value (TC-TAG-ASSET-050).
    expect(
      padded,
      `Expected a whitespace-padded search for "${targetTrackingNumber}" to be trimmed and match that container`
    ).toEqual([targetTrackingNumber]);
  });
});
