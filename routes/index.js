var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
const { SECRET, ERROR_CODES, ERROR_MESSAGE } = require('../costants');
const db = require('../db')

const wrap = func => async (req, res, next) => {
  try {
    await func(req, res, next)
  } catch(e) {
    next(e)
  }
}

/* login */
router.post('/login', wrap(async function(req, res, next) {
  let user = await db.users.findOne({ username: req.body.username, password: req.body.password })
  if (!user) {
    res.json({ code: ERROR_CODES.USERNAME_PASSWORD_ERROR, message: ERROR_MESSAGE[ERROR_CODES.USERNAME_PASSWORD_ERROR] })
    return
  }
  const token = jwt.sign({ username: user.username, _id: user._id }, SECRET)
  res.json({ code: 200, data: token })
}));

/* register */
router.post('/register', wrap(async function(req, res, next) {
  let user = await db.users.findOne({ username: req.body.username })
  if (user) {
    res.json({ code: ERROR_CODES.ACCOUNT_EXISTS, message: ERROR_MESSAGE[ERROR_CODES.ACCOUNT_EXISTS] })
    return
  }
  user = await db.users.insert({ username: req.body.username, password: req.body.password })
  res.json({ code: 200, data: {} })
}));

/* get books */
router.get('/books', wrap(async function(req, res, next) {
  let books = await db.books.findOne({ userId: req.user._id })
  res.json({ code: 200, data: books ? books.list : [] })
}));

/* set books */
router.post('/books', wrap(async function(req, res, next) {
  let books = await db.books.findOne({ userId: req.user._id })
  const data = Array.isArray(req.body) ? req.body.map(x => ({ name: x.name, lastUrl: x.lastUrl })) : []
  if (!data.every(x => x.name && x.lastUrl && x.lastUrl.startsWith("http"))) {
    res.json({ code: ERROR_CODES.BOOKS_FIELDS, message: ERROR_MESSAGE[ERROR_CODES.BOOKS_FIELDS] })
    return
  }
  if (books) {
    await db.books.update({ userId: req.user._id }, { $set: { list: data }})
  } else {
    await db.books.insert({ userId: req.user._id, list: data })
  }
  res.json({ code: 200, data: {} })
}));

/* register */
router.get('/sources', wrap(async function(req, res, next) {
  let sources = await db.sources.findOne({ userId: req.user._id })
  res.json({ code: 200, data: sources ? sources.list : [] })
}));

const keys = [
  "bookSourceUrl",
"ruleBookContent",
"ruleBookTitle",
"ruleNextPage",
"rulePrevPage"
]

/* register */
router.post('/sources', wrap(async function(req, res, next) {
  let sources = await db.sources.findOne({ userId: req.user._id })
  const data = Array.isArray(req.body) ? req.body.map(x => {
    const item = {}
    Object.keys(x).forEach(i => {
      if(keys.includes(i)) {
        item[i] = x[i]
      }
    })
    return item
  }) : []
  if (!data.every(x => x[keys[0]] && x[keys[0]].startsWith("http"))) {
    res.json({ code: ERROR_CODES.SOURCES_FIELDS, message: ERROR_MESSAGE[ERROR_CODES.SOURCES_FIELDS] })
    return
  }
  if (sources) {
    await db.sources.update({ userId: req.user._id }, { $set: { list: data }})
  } else {
    await db.sources.insert({ userId: req.user._id, list: data })
  }
  res.json({ code: 200, data: {} })
}));

module.exports = router;
