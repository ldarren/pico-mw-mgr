module.exports = {
	async getInv(user, inv, prefix, next){
		const userId = user.userId
		for (let i of [1, 2, 3, 4]){
			inv.push({
				id: userId + prefix + i
			})
		}
		await next()
	}
}
