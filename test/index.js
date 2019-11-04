const Koa = require('koa')
const Router = require('koa-router')
const mwm = require('../index')
const ums = require('./ums')
const inv = require('./inv')

const app = new Koa()
const router = new Router()

async function combine(user, inv, output, next){
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
	[output, 'ctx', 'warn'],
)

mwm(
	'print',
	[(output, next) => {
		console.log(output); return next()
	}, 'output']
)

mwm(
	'* * * * * *',
	[async (next) => {
		console.log('tick', Date.now())

		const prints = []
		for (let i = 0; i < 2; i++){
			prints.push(mwm.branch('print', {output: {data: i}}))
		}
		await Promise.all(prints)
		await next()
	}]
)

router.get('/users/:userId', mwm(
	[mwm.validate({
		type: 'object',
		required: 1,
		spec: {
			userId: {
				type: 'number',
				required: 1
			}
		}
	}, 'params'), 'ctx', 'user'],
	[ums.getUser, 'user', '#darren liew'],
	[mwm.ajax('GET', 'https://httpbin.org/anything/:userId'), 'user', 'output'],
	[mwm.log, 'output'],
	[inv.getInv, 'user', ':inv', 1111],
	[combine, 'user', ':inv', 'output'],
	[output, 'ctx', 'output'],
))

router.get('/qs', mwm(
	[mwm.validate({
		type: 'object',
		required: 1,
		spec: {
			s0: 'string',
			'a0': 'array',
			s1: {
				type: 'string',
				required: 1
			},
			'a1': {
				type: 'array',
				required: 1
			}
		}
	}, 'query'), 'ctx', 'input'],
	[output, 'ctx', 'input'],
))

router.get('/header', mwm(
	[mwm.validate({
		type: 'object',
		required: 1,
		spec: {
			key0: 'string',
			key1: {
				type: 'string',
				required: 1
			},
		}
	}, 'headers'), 'ctx', 'input'],
	[output, 'ctx', 'input'],
))

router.get('/', mwm(
	[output, 'ctx', null]
))

app
	.use(router.routes())
	.use(router.allowedMethods())

app.listen(3000, () => {
	console.info('GET localhost:3000/users/:userid response ===  {"user":{"userId":":userid"},"inv":[{"id":"xxxx"}]}')
	console.info('GET localhost:3000/qs?s1=hello&s2=world&a1=foo&a1=bar response ===  {"s0":"hello","s1":"world","a0":["foo","bar"]}')
	console.info('GET localhost:3000/header response ===  {"key0":"val0","key1":"val1"')
})
