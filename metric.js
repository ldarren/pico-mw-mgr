// REF:
// https://community.tibco.com/wiki/monitoring-your-nodejs-apps-prometheus
// https://www.robustperception.io/how-does-a-prometheus-summary-work

const prom = require('prom-client')
let interval

const mw_metric = new prom.Histogram({
	name: 'mwm_mw',
	help: 'http response time (second) breakdown by middlewares',
	labelNames: ['method', 'route', 'path', 'mw', 'state'],
	buckets: [0.1, 0.3, 1, 10, 60]
})

module.exports = {
	start(){
		interval = prom.collectDefaultMetrics()
	},

	stop(){
		clearInterval(interval)
		prom.register.clear()
	},

	timer(method, route, path, mw){
		return mw_metric.startTimer({method, route, path, mw})
	},

	observe(method, route, path, mw, state, time){
		mw_metric.labels(method, route, path, mw, state).observe(time)
	},

	contentType(){
		return prom.register.contentType
	},

	output(){
		return prom.register.metrics()
	},

	outputJSON(){
		return prom.register.getMetricsAsJSON()
	},
}
