const Koa = require('koa')
const Router = require('koa-router')
const mwm = require('../index')
const ums = require('./ums')
const inv = require('./inv')

const app = new Koa()
const router = new Router()

async function combine(ctx, user, inv, output, next){
	Object.assign(output, {
		user,
		inventory: inv
	})
	await next()
}

async function output(ctx, data, next){
	if (!data || !Object.keys(data).length){
		ctx.status = 204
		return next()
	}
	ctx.status = 200
	ctx.body = data
	await next()
}

mwm(
	'warn/user/id',
	[output, 'warn'],
)

mwm(
	'* * * * * *',
	[async (ctx, next) => {
		console.log('tick', Date.now())
		await next()
	}]
)

router.get('/users/:userId', mwm(
	[mwm.validate({
		userId: {
			type: 'number',
			required: 1
		}
	}, 'params'), 'user'],
	[ums.getUser, 'user', '#darren liew'],
	[inv.getInv, 'user', ':inv', 1111],
	[combine, 'user', ':inv', 'output'],
	[output, 'output'],
))

router.get('/', mwm(
	[output, null]
))

app
	.use(router.routes())
	.use(router.allowedMethods())

app.listen(3000, () => console.info('GET localhost:3000/users/:userid response ===  {"user":{"userId":":userid"},"inv":[{"id":"xxxx"}]}'))
