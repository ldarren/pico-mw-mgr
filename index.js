async function pipeline(ctx, middlewares, i, data, next){
	const middleware = middlewares[i++]
	if (!middleware) return next()

	const params = middleware.slice(1).map(key => {
		if (!key || !key.charAt) return key
		if (!data[key]) data[key] = {}
		return data[key]
	})

	await middleware[0](ctx, ...params, async err => {
		if (err) return ctx.throw(err)
		await pipeline(ctx, middlewares, i, data, next)
	})
}

module.exports = function(...middlewares){
	return (ctx, next) => pipeline(ctx, middlewares, 0, { }, next)
}
