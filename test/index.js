const Koa = require('koa');
const Router = require('koa-router');
const mwm = require('../index');
const ums = require('./ums');
const inv = require('./inv');

const app = new Koa();
const router = new Router();

async function combine(ctx, user, inv, output, next){
	Object.assign(output, {
		user,
		inv
	})
	await next()
}

async function output(ctx, data, next){
	if (!data){
		ctx.status = 201
		return next()
	}
	ctx.status = 200
	ctx.body = data
	await next()
}

router.get('/:userid', mwm(
	[ums.getUser, 'user'],
	[inv.getInv, 'user', 'inv'],
	[combine, 'user', 'inv', 'output'],
	[output, 'output'],
))

router.get('/', mwm(
	[output, null]
))

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(3000, () => console.log('GET localhost:3000/:userid should get {"user":{"userId":":userid"},"inv":{"id":":useridxxx"}}'))
