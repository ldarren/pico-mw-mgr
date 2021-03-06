const Koa = require('koa')
const Router = require('koa-router')
const mwm = require('../index')
const ums = require('./ums')
const inv = require('./inv')

const app = new Koa()
const router = new Router()

async function combine(user, inv, bin, output, next){
	Object.assign(output, {
		user,
		inventory: inv,
		bin
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
	[mwm.log, 'output'],
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
	[inv.getInv, 'user', ':inv', 1111],
	[mwm.ajax('GET', '/anything/:userId', {domain:'https://httpbin.org'}), 'user', ':inv', 'bin'],
	[mwm.log, 'user', ':inv', 'bin'],
	[combine, 'user', ':inv', 'bin', 'output'],
	[output, 'ctx', 'output'],
))

router.get('/qs', mwm(
	[mwm.validate({
		type: 'object',
		required: 1,
		spec: {
			group: 'array',
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
	}, 'query', [['a0', 'a1']]), 'ctx', 'input'],
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
	console.info('GET localhost:3000/qs?s1=hello&s2=world&a0=key1&a0=key2&a1=foo&a1=bar response ===  {"s0":"hello","s1":"world","group": [{"a0":"key1", "a1": "foo"}, {"a0": "key2", "a1": "bar"}]}')
	console.info('GET localhost:3000/header response ===  {"key0":"val0","key1":"val1"}')
})
