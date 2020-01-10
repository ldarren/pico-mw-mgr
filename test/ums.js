module.exports = {
	async getUser(user, name, next){
		if (!user.userId) return await next({
			status: 401,
			message: 'invalid userid: ' + user.userId,
			code: 1
		})

		if (0 > user.userId) return await next(null, 'warn/user/id', {warn:{
			status: 400,
			message: `are you getting: ${Math.abs(user.userId)}?`,
			code: 2
		}})

		Object.assign(user, {
			name
		})

		await next()
	}
}
