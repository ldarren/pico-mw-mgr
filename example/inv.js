module.exports = {
	getInv: async function(ctx, user, inv, next){
		Object.assign(inv, {
			id: user.userId + 'xxx'
		})
		await next()
	},
	output: async function(ctx, user, inv, next){
		ctx.body = {
			user,
			inv
		}
		await next()
	}
}
