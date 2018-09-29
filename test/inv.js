module.exports = {
	async getInv(ctx, user, inv, next){
		Object.assign(inv, {
			id: user.userId + 'xxx'
		})
		await next()
	}
}
