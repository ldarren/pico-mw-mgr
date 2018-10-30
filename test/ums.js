module.exports = {
	getUser: async function(ctx, user, name, next){
		Object.assign(user, {
			userId: ctx.params.userid,
			name
		})
		await next()
	}
}
