const path = require('path')
const Datastore = require('nedb-promises')

let basePath = __dirname

const dbFactory = (fileName) => Datastore.create({
  filename: path.join(basePath, `/data/${fileName}.db`),
  timestampData: true,
  autoload: true
})

module.exports = {
  users: dbFactory('users'),
  sources: dbFactory('sources'),
  books: dbFactory('books'),
}
