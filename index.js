const pTime = require('pico-common').export('pico/time')
const router = {}
const timer = {}

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
		if (err) return ctx.throw(err)
		if (route && router[route]){
			return await pipeline(ctx, router[route], 0, newdata, next)
		}
		await pipeline(ctx, middlewares, i, data, next)
	})
}

async function trigger(ast, middlewares){
	await pipeline(null, middlewares, 0, { }, err => {
		if (err) throw err
	})
	return setTimeout(trigger, pTime.nearest(...ast) - Date.now(), ast, middlewares)
}

module.exports = function(...middlewares){
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
