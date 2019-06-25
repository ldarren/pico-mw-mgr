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

let debug = () => {}
if (process.env.DEBUG){
	debug = console.log
}

mwm(
	'warn/user/id',
	[output, 'warn'],
)

mwm(
	'print',
	[(ctx, output, next) => {
		debug(output)
		return next()
	}, 'output']
)

mwm(
	'* * * * * *',
	[async (ctx, next) => {
		debug('tick', Date.now())

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

router.get('/qs', mwm(
	[mwm.validate({
		string0: 'string',
		'array0[]': 'array',
		string1: {
			type: 'string',
			required: 1
		},
		array1: {
			type: 'array',
			required: 1
		}
	}, 'query'), 'input'],
	[output, 'input'],
))

router.get('/header', mwm(
	[mwm.validate({
		key0: 'string',
		key1: {
			type: 'string',
			required: 1
		},
	}, 'headers'), 'input'],
	[output, 'input'],
))

router.get('/', mwm(
	[output, null]
))

router.get('/metrics', mwm(
	[mwm.metrics],
))

app
	.use(router.routes())
	.use(router.allowedMethods())

app.listen(1337, () => {
	console.info('GET localhost:1337/users/:userid response ===  {"user":{"userId":":userid"},"inv":[{"id":"xxxx"}]}')
	console.info('GET localhost:1337/qs?s1=hello&s2=world=a0[]=foo&a0[]=bar response ===  {"s0":"hello","s1":"world","a0":["foo","bar"]}')
	console.info('GET localhost:1337/header response ===  {"key0":"val0","key1":"val1"')
})
