module.exports = {
	async getInv(ctx, user, inv, prefix, next){
		const userId = parseInt(user.userId) || 0
		for (let i of [1, 2, 3, 4]){
			inv.push({
				id: userId + prefix + i
			})
		}
		await next()
	}
}
