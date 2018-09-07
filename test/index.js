const Koa = require('koa');
const Router = require('koa-router');
const mwm = require('../index');
const ums = require('./ums');
const inv = require('./inv');

const app = new Koa();
const router = new Router();

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

app.listen(3000, () => console.log('GET localhost:3000/:userid should get {"user":{"userId":":userid"},"inv":{"id":":useridxxx"}}'))
