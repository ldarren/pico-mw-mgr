const pTime = require('pico-common').export('pico/time')
const pObj = require('pico-common').export('pico/obj')
const dummyNext = () => {}
const router = {}

async function pipeline(ctx, middlewares, i, data, next){
	const middleware = middlewares[i++]
	if (!middleware) return next()

	const params = middleware.slice(1).map(key => {
		if (!key || !key.charAt) return key
		let datakey = data[key]
		if (!datakey){
			switch(key.charAt(0)){
			case ':':
				data[key] = datakey = []
				break
			case '#':
				datakey = key.substring(1)
				break
			default:
				data[key] = datakey = {}
				break
			}
		}
		return datakey
	})

	await middleware[0](ctx, ...params, async (err, route, newdata) => {
		if (err) {
			if (ctx) return ctx.throw(err)
			throw err
		}
		if (route && router[route]){
			return await pipeline(ctx, router[route], 0, newdata, next)
		}
		await pipeline(ctx, middlewares, i, data, next)
	})
}

async function trigger(ast, middlewares){
	setTimeout(trigger, pTime.nearest(...ast) - Date.now(), ast, middlewares)
	await pipeline(null, middlewares, 0, { }, err => {
		if (err) throw err
	})
}

function mwm(...middlewares){
	const key = middlewares[0]
	if (!key) return
	if (!Array.isArray(key)){
		middlewares.shift()
		const ast = pTime.parse(key)
		if (ast) return setTimeout(trigger, pTime.nearest(...ast) - Date.now(), ast, middlewares)
		return router[key] = middlewares
	}
	return (ctx, next) => pipeline(ctx, middlewares, 0, { }, next)
}

mwm.validate = (spec, source = 'body') => {
	return (ctx, output, next) => {
		let obj
		switch(source){
		case 'body':
			obj = ctx.request.body
			break
		case 'params':
			obj = ctx.params
			break
		case 'query':
			obj = ctx.request.query
			break
		case 'headers':
			obj = ctx.request.headers
			break
		}
		const found = pObj.validate(spec, obj, output)
		if (found) return next(`invalid params [${found}]`)
		return next()
	}
}

mwm.branch = (ctx, route, newdata, next = dummyNext) => {
	const middlewares = router[route]
	if (!middlewares) throw `route[${route}] not found`
	return pipeline(ctx, middlewares, 0, newdata, next)
}

mwm.dot = (ctx, input, params, def, output, next) => {
	const ret = pObj.dot(input, params.slice(), def)
	if (!ret) return next(`invalid params [${params}]`)
	Object.assign(output, ret)
	return next()
}

mwm.pluck = (ctx, arr, idx, obj, next) => {
	if (idx >= arr.length) return next()
	Object.assign(obj, arr[idx])
	return next()
}

module.exports = mwm
