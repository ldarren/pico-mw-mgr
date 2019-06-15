# pico-mw-mgr
A pico sized middleware manager for Koajs

## introduction
This module help you manage your koajs middlewares

- it makes middleware more reusable,
- it provides route branching
- it triggers route by timer

have you ever done this? passing values among middlewares by overloading `ctx`?
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
to use pico-mw-mgr, pass the pico-mw-mgri (mwm) function to your router of choice. the mwm function accept a list of array as parameters.

```javascript
const mwm = require('pico-mw-mgr')

router.get('/test/:test_id', mwm(
	[ur_mw_1, 'param1'], // param1 is initialize as a js empty object
	[ur_mw_2, 'param1'], // param1 will be reused here with whatever value is assigned to it in ur_mw_2
))
```
each array in the list is one middleware. the first item in the aaray is the middleware function, subsequence items in the array are the parameters pass into the middleware.

when a paramter is first defined, it will be initialized by pico-mw-mgr.

### reusable middleware
in this example pico-mw-mgr is used with [koa-router](https://github.com/alexmingoia/koa-router)

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
this example shown that the paramter of middleware were determined when creating the route, instead of determined at the time of creating the middleware, this make the middleware more reusable.

a working example can be found in `/test` folder. run the example by `npm test`

### parameter initialization
by default when a parameter initialize as a empty js object
```javascript
router.get('/users/:userId', mwm(
	[func, 'obj']
))

function func(ctx, param1, next){
	// param1 is an object
}
```
`func` middleware will receive an empty js object. besides object, pico-mw-mgr also supported other native js data structures

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
if a route has more than one result (excluded error results). the route branching feature can used to simplify the route design.
to create a route branch, mwm first parameter must be a string

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
route can be triggered by timer as well. to create the a timed route, the first item must be a string and the string must comprising six fields sperarated by white space that represent Minutes, Hours, Day of month, MOnth, Day of Week and Year respectively

the timer expression is similar to [CRON expression](https://en.wikipedia.org/wiki/Cron#CRON_expression), without the special characters `L`, `W`, `#`, `?`, `JAN-DEC` and `SUN-SAT` support

```javascript
mwm(
	'*/5 * * * * *',
	[async (ctx, next) => { console.log('tick'); await next();}]
)
```
the above route will be triggered for every 5 minutes

### Prometheus Integration
pico-mw-mgr can export promethues metric by default
follow the following steps illustrated the easiest way to view the prometheus metrics on Grafana
- create a `GET /metrics` route in your app
- install grafana docker `docker run -d -p 3000:3000 grafana/grafana`
- install prometheus docker `docker run -p 9090:9090 -v <path>/pico-mw-mgr/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus`
- open grafana `http://localhost:3000`
- add promethues data source (url=`http://localhost:9090`, Access=`Browser`)
- create a new dashboard and add a new panel
- edit panel and enter `sum(mwm_mw_sum{method="GET", route="/users/:userId", state="200"}) by (mw)` in query
- edit panel and use `stack` in panel settings

## installation
```
npm i pico-mw-mgr
```

## test
```
npm test
```

and make a test query by

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
