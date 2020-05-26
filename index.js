const picosUtil = require('picos-util')
const pTime = require('pico-common').export('pico/time')
const pObj = require('pico-common').export('pico/obj')
const pStr = require('pico-common').export('pico/str')
const dummyNext = () => {}
const router = {}

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

	await middleware[0](...params, async (err, route, newdata = data) => {
		if (err) {
			if (data && data.ctx) return data.ctx.throw(err)
			throw err
		}
		if (route) {
			if (router[route]) return await pipeline(router[route], 0, newdata, next)
			throw new Error(`Middleware router [${key}] not found`)
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
		if (router[key]) throw new Error(`Middleware router [${key}] is already defined`)
		return router[key] = middlewares
	}
	return (ctx, next) => pipeline(middlewares, 0, {ctx}, next)
}

mwm.isDefined = key => !!router[key]

mwm.log = (...args) => {
	const len = args.length
	args.slice(0, len - 1).forEach(a => console.log(a))
	return args[len - 1]()
}

mwm.validate = (spec, source = 'body') => {
	return (ctx, output, next) => {
		let obj
		switch(source){
		case 'body':
			obj = ctx.req.body || ctx.request.body
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

mwm.ajax = (method, path, opt) => {
	const href = pObj.dot(opt, ['domain'], '') + path
	const rest = []
	pStr.compileRest(href, rest)
	return (params, body, output, next) => {
		return new Promise((resolve, reject) => {
			const url = pStr.buildRest(href, rest, params)
			if (!url) {
				reject('invalid params')
				return next('invalid params')
			}
			picosUtil.ajax(method, pStr.buildRest(href, rest, params), body, opt, (err, state, res) => {
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
