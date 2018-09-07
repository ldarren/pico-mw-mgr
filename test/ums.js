module.exports = {
	getUser: async function(ctx, user, next){
		Object.assign(user, {
			userId: ctx.params.userid
		})
		await next()
	}
}
