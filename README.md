# pico-mw-mgr
A pico sized and zero dependencies middleware manager for Koajs

## introduction
have you ever wished that you can define the input and output of a koajs middleware?

have you ever done this? passing values across middlewares by overloading `ctx`?
```javascript
async function middleware(ctx, next){
	const input = ctx.input

	const output = await model.query(input.paramX, input.paramY)

	ctx.output = {
		resultA: output.resultA,
		resultB: output.resultB
	}

	await next()
}
```
and keep your fingers crossed that `input` and `output` are not overriding by other middlewares?

pico-mw-mgr solves this problem. by:
- allowed customizable middleware parameters instead of just `ctx` and `next`
- allowed per route configuration
- create new paramters on the fly

## usage
use pico-mw-mgr with [koa-router](https://github.com/alexmingoia/koa-router)

```javascript
const mwm = require('pico-mw-mgr')
const ums = require('./ums')
const payment = require('./payment')

router.get('/users/:userId', mwm(
	[ums.getUserObj, 'user'], // user object created on demand
	[payment.getPaymentHistory, 'user', 'payment'], // pass in populated user and a new payment
	[ums.send, 'user', 'payment']
))

// ums.js
module.exports = {
	// ctx and next are inserted by default
	async getUserObj(ctx, output, next){
		Object.assign(output, {
			userId: ctx.params.userId
		})
		await next()
	},
	async send(ctx, user, payment, next){
		ctx.body = {
			user,
			payment
		}
		await next()
	}
}

// history.js
module.exports = {
	async getPaymentHistory(ctx, input, output, next){
		const payments = model.getHistory(input.userId)
		Object.assign(output, {
			payments
		})
		await next()
	}
}
```
a working example can be found in `/test` folder. run the example by `npm test`

### parameter initialization
by default when a parameter initialize as pure js object
```javascript
router.get('/users/:userId', mwm(
	[func, 'obj']
))

function func(ctx, param1, next){
	// param1 is an object
}
```
`func` middleware will receive an empty js object. there are other data type supported

```javascript
router.get('/users/:userId', mwm(
	[func, 'obj', ':arr', '#hello world', 123, null]
))

function func(ctx, param1, param2, param3, param4, param5, next){
	// param1 is an object
	// param2 is an array
	// param3 is a string and value is 'hello world'
	// param4 is a number and value is 123
	// param4 is an object and value is a null
}
```

### route branching
if a route could end with more than one results (non error). route branching can simplify the route design.
to create a route branch, mwm first parameter should be a string

```javascript
mwm(
	'branch/1',
	[func1, 'in1', 'in2', 'output'],
	[func, 'output']
)
mwm(
	'branch/2',
	[func2, 'in1', 'output'],
	[func, 'output']
)

router.get('/users/:userid', mwm(
	[async (ctx, output, next) => {
		const userid = parseInt(ctx.params.userid)
		if(0 < userid){
			return await next(null, 'branch/1', {
				in1: 'hello',
				in2: 'world'
			})
		} else if (!userid) {
			return await next(null, 'branch/2', {
				in1: 'foobar'
			})
		}
		Object.assign(output, {foo: 'bar'})
		await next()
	}, 'output'],
	[func, 'output']
))
```

### timed route
route can be triggered from time as well

```javascript
mwm(
	'*/5 * * * * *',
	[async (ctx, next) => { console.log('tick'); await next();}]
)
```
the above route will be triggered for every 5 minutes
the timer expression is similar to [CRON expression](https://en.wikipedia.org/wiki/Cron#CRON_expression), special characters `L`, `W`, `#`, `?`, `JAN-DEC` and `SUN-SAT`

## installation
```
npm i pico-mw-mgr
```

## test
```
npm test
```

and make query by

```
curl localhost:3000/users/123
```

to see error

```
curl localhost:3000/users/0
```

to see warning

```
curl localhost:3000/users/-123
```
