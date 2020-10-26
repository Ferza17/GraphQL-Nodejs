/**
 * ========= Packages ==============
 */
const { buildSchema } = require("graphql");
/**
 * ========= End Packages ==============
 */

module.exports = buildSchema(`
    type TestData {
        text: String!
        views: Int!
    }
    type RootQuery {
        hello: TestData!
    }
    schema {
        query: RootQuery
    }
`);
