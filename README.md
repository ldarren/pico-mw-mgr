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

this middleware manager solve this problem. by:
- allowed customizable middleware parameters instead of just `ctx` and `next`
- allowed per route configuration
- create new paramters on the fly

## usage
use pico-mw-mgr with koajs-router

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
a working example can be found in `/example` folder. run the example by `npm start`

## parameter initialization
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

## installation
```
npm i pico-mw-mgr
```

### test
```
npm test
```

and make query by

```
curl localhost:3000/123
```
