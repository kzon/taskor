const app = require("../server/server")
const chai = require("chai")
const chaiHttp = require("chai-http")
const expect = chai.expect

chai.use(chaiHttp)

module.exports = {
    app,
    chai,
    expect
}
