var Koa = require('koa');
var Router = require('koa-router');
var mwm = require('../index');
var ums = require('./ums');
var inv = require('./inv');

var app = new Koa();
var router = new Router();

router.get('/', (ctx, next) => {
	ctx.body = 'Hello'
	next()
})

router.get('/:userid', mwm(
	[ums.getUser, 'ctx', 'user'],
	[inv.getInv, 'ctx', 'user', 'inv'],
	[inv.output, 'ctx', 'user', 'inv'],
))

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000)
