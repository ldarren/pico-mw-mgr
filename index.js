async function pipeline(middlewares, i, data, next){
	const middleware = middlewares[i++]
	if (!middleware) return next()

	const params = middleware.slice(1).map(key => {
		if (!data[key]) data[key] = {}
		return data[key]
	})

	await middleware[0](...params, async err => {
		if (err) return await next(err)
		await pipeline(middlewares, i, data, next)
	})
}

module.exports = function(...middlewares){
	return async function(ctx, next){
		return await pipeline(middlewares, 0, { ctx }, next)
	}
}