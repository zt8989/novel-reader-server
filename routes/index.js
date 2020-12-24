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

router.get("/status", function(req, res){
  res.json({ code: 200, data: {} })
})

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
router.get('/books/list', wrap(async function(req, res, next) {
  let books = await db.books.find({ userId: req.user._id })
  res.json({ code: 200, data: books })
}));

/* set books */
router.get('/books', wrap(async function(req, res, next) {
  const book = await db.books.findOne({ userId: req.user._id, name: req.query.name })
  res.json({ code: 200, data: book })
}));

router.post('/books', wrap(async function(req, res, next) {
  const data = req.body
  if(data.name && data.lastUrl && data.lastUrl.startsWith("http")) {
    const book = await db.books.findOne({ userId: req.user._id, name: req.body.name })
    if (book) {
      await db.books.update({ _id: book._id }, { $set: { lastUrl: data.lastUrl } })
    } else {
      await db.books.insert({ userId: req.user._id, name: data.name, lastUrl: data.lastUrl, deleted: false })
    }
    res.json({ code: 200, data: {} })
  } else {
    res.json({ code: 500, message: "参数错误", data: {} })
  }
}));

// 同步，更新，插入，删除
router.post('/books/sync', wrap(async function(req, res, next) {
  let data = Array.isArray(req.body) ? req.body.map(x => ({ name: x.name, lastUrl: x.lastUrl, updatedAt: x.updatedAt, deleted: x.deleted })) : []
  if (!data.every(x => x.name && x.lastUrl && x.lastUrl.startsWith("http"))) {
    res.json({ code: ERROR_CODES.BOOKS_FIELDS, message: ERROR_MESSAGE[ERROR_CODES.BOOKS_FIELDS] })
    return
  }

  data = data.filter(x => !x.deleted)
  
  let books = await db.books.find({ userId: req.user._id })

  const inserts = data.filter(x => !books.some(b => b.name === x.name))

  const updates = data.filter(x => {
    const book = books.find(b => b.name === x.name)
    return book && (new Date(x.updatedAt).getTime()) > book.updatedAt.getTime()
  })

  // const deletes = books.filter(b => !data.some(x => x.name === b.name))

  for (let book of inserts) {
    const { name, lastUrl } = book 
    await db.books.insert({ userId: req.user._id, name, lastUrl, deleted: false })
  }


  for (let book of updates) {
    const { name, lastUrl } = book 
    await db.books.update({ userId: req.user._id, name }, { $set: { lastUrl } })
  }

  // await db.books.remove({ _id: { $in: deletes.map(x => x._id) }}, { multi: true });

  books = await db.books.find({ userId: req.user._id })

  res.json({ code: 200, data: books })
}));

router.delete('/books', wrap(async function(req, res, next) {
  const data = req.body
  if(data.name) {
    const del = await db.books.update({ name: req.body.name }, { $set: { deleted: true }})
    res.json({ code: 200, data: del })
  } else {
    res.json({ code: 500, message: "参数错误", data: {} })
  }
}));

/* set books */
router.post('/books/list', wrap(async function(req, res, next) {
  const data = Array.isArray(req.body) ? req.body.map(x => ({ name: x.name, lastUrl: x.lastUrl })) : []
  if (!data.every(x => x.name && x.lastUrl && x.lastUrl.startsWith("http"))) {
    res.json({ code: ERROR_CODES.BOOKS_FIELDS, message: ERROR_MESSAGE[ERROR_CODES.BOOKS_FIELDS] })
    return
  }

  await db.books.remove({ userId: req.user._id }, { multi: true })

  const inserts = data.map(x => {
    return { userId: req.user._id, name: x.name, lastUrl: x.lastUrl }
  })

  for (let book of inserts) {
    await db.books.insert(book)
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
