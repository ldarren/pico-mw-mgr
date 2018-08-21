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
	[ums.getUserObj, 'ctx', 'user'], // user object created on demand
	[payment.getPaymentHistory, 'user', 'payment'], // pass in populated user and a new payment
	[ums.send, 'ctx', 'user', 'payment']
))

// ums.js
module.exports = {
	getUserObj: async function(ctx, output, next){
		Object.assign(output, {
			userId: ctx.params.userId
		})
		await next()
	},
	send: async function(ctx, user, payment, next){
		ctx.body = {
			user,
			payment
		}
		await next()
	}
}

// history.js
module.exports = {
	getPaymentHistory: async function(input, output, next){
		const payments = model.getHistory(input.userId)
		Object.assign(output, {
			payments
		})
		await next()
	}
}
```
a working example can be found in `/example` folder. run the example by `npm start`

## installation
```
npm i pico-mw-mgr
```
