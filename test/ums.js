module.exports = {
	async getUser(ctx, user, name, next){
		const userId = parseInt(ctx.params.userid)

		if (!userId) return await next({
			status: 401,
			message: 'invalid userid: ' + userId,
			code: 1
		})

		if (0 > userId) return await next(null, 'warn/user/id', {warn:{
			status: 400,
			message: `are you getting: ${Math.abs(userId)}?`,
			code: 2
		}})

		Object.assign(user, {
			userId,
			name
		})

		await next()
	}
}
