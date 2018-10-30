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

	await middleware[0](ctx, ...params, async err => {
		if (err) return ctx.throw(err)
		await pipeline(ctx, middlewares, i, data, next)
	})
}

module.exports = function(...middlewares){
	return (ctx, next) => pipeline(ctx, middlewares, 0, { }, next)
}
