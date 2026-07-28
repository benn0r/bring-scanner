import { PRODUCT_DATABASES } from '../../src/productDatabases';

describe('product database links', () => {
  it('lists each lookup database with an HTTPS world URL and description', () => {
    expect(PRODUCT_DATABASES).toHaveLength(4);
    for (const database of PRODUCT_DATABASES) {
      expect(database.url).toMatch(
        /^https:\/\/world\.open(?:food|products|beauty|petfood)facts\.org$/,
      );
      expect(database.description.length).toBeGreaterThan(20);
    }
  });
});
