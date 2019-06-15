const Koa = require('koa')
const Router = require('koa-router')
const mwm = require('../index')
const ums = require('./ums')
const inv = require('./inv')

const app = new Koa()
const router = new Router()

function combine(ctx, user, inv, output, next){
	Object.assign(output, {
		user,
		inventory: inv
	})
	return next()
}

function output(ctx, data, next){
	if (!data || !Object.keys(data).length){
		ctx.status = 204
		ctx.body = data
		return next()
	}
	ctx.status = 200
	ctx.body = data
	return next()
}

mwm(
	'warn/user/id',
	[output, 'warn'],
)

mwm(
	'print',
	[(ctx, output, next) => {
		console.log(output)
		return next()
	}, 'output']
)

mwm(
	'* * * * * *',
	[async (ctx, next) => {
		console.log('tick', Date.now())

		const prints = []
		for (let i = 0; i < 2; i++){
			prints.push(mwm.branch(ctx, 'print', {output: {data: i}}))
		}
		await Promise.all(prints)
		return next()
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

router.get('/metrics', mwm(
	[mwm.metrics, 'output'],
	[output, 'output']
))

app
	.use(router.routes())
	.use(router.allowedMethods())

app.listen(1337, () => console.info('GET localhost:3000/users/:userid response ===  {"user":{"userId":":userid"},"inv":[{"id":"xxxx"}]}'))
