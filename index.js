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

	await middleware[0](ctx, ...params, async (err, route, newdata, newnext) => {
		if (err) return ctx.throw(err)
		if (route && router[route]){
			return await pipeline(ctx, router[route], 0, newdata, newnext || next)
		}
		await pipeline(ctx, middlewares, i, data, next)
	})
}

module.exports = function(...middlewares){
	const key = middlewares[0]
	if (!key) return
	if (!Array.isArray(key)){
		router[key] = middlewares
		return middlewares.shift()
	}
	return (ctx, next) => pipeline(ctx, middlewares, 0, { }, next)
}
