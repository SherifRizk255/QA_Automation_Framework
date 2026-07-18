import {
  test as portalTest,
  expect,
} from './portalRepositoryFixture';
import { CrossSystemCrmValidator } from '../utils/crm';

type CrossSystemFixtures = {
  crossSystemCrmValidator: CrossSystemCrmValidator;
};

export const test = portalTest.extend<CrossSystemFixtures>({
  crossSystemCrmValidator: async ({ browser }, use) => {
    const validator = new CrossSystemCrmValidator(browser);

    await use(validator);

    await validator.close();
  },
});

export { expect };
