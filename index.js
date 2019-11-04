const picosUtil = require('picos-util')
const pTime = require('pico-common').export('pico/time')
const pObj = require('pico-common').export('pico/obj')
const pStr = require('pico-common').export('pico/str')
const dummyNext = () => {}
const router = {}
const rest = []

async function pipeline(middlewares, i, data, next){
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

	await middleware[0](...params, async (err, route, newdata) => {
		if (err) {
			if (data && data.ctx) return data.ctx.throw(err)
			throw err
		}
		if (route && router[route]){
			return await pipeline(router[route], 0, newdata, next)
		}
		await pipeline(middlewares, i, data, next)
	})
}

async function trigger(ast, middlewares){
	setTimeout(trigger, pTime.nearest(...ast) - Date.now(), ast, middlewares)
	await pipeline(middlewares, 0, { }, err => {
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
	return (ctx, next) => pipeline(middlewares, 0, {ctx}, next)
}

mwm.log = (...args) => {
	const len = args.length
	args.slice(0, len - 1).forEach(a => console.log(a))
	args[len - 1]()
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
			obj = Object.assign({}, ctx.request.query)
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

mwm.branch = (route, newdata, next = dummyNext) => {
	const middlewares = router[route]
	if (!middlewares) throw `route[${route}] not found`
	return pipeline(middlewares, 0, newdata, next)
}

mwm.dot = (input, params, def, output, next) => {
	const ret = pObj.dot(input, params.slice(), def)
	if (!ret) return next(`invalid params [${params}]`)
	Object.assign(output, ret)
	return next()
}

mwm.ajax = (method, href, opt) => {
	pStr.compileRest(href, rest)
	return (params, output, next) => {
		return new Promise((resolve, reject) => {
			picosUtil.ajax(method, pStr.buildRest(href, rest, params), params, opt, (err, state, res) => {
				if (4 !== state) return
				if (err) {
					reject(err)
					return next(err)
				}
				try {
					Object.assign(output, JSON.parse(res))
					resolve()
				}catch (exp){
					reject(exp)
					return next(exp)
				}
				return next()
			})
		})
	}
}

module.exports = mwm
