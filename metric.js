// REF:
// https://community.tibco.com/wiki/monitoring-your-nodejs-apps-prometheus
// https://www.robustperception.io/how-does-a-prometheus-summary-work

const prom = require('prom-client')
let interval
const metrics = {}

module.exports = {
	start(){
		interval = prom.collectDefaultMetrics()
	},

	stop(){
		clearInterval(interval)
		prom.register.clear()
	},

	createHistogram(name, help){
		return new prom.Histogram({
			name,
			help,
			labelNames: ['method', 'route', 'path', 'mw', 'state']
		})
	},

	startTimer(metric, method, route, path, mw){
		if (!metric) throw 'invalid metric'
		return metric.startTimer({method, route, path, mw})
	},

	observe(metric, method, route, path, mw, state, time){
		metric.labels(method, route, path, mw, state).observe(time/1000)
	},

	contentType(){
		return prom.register.contentType
	},

	outputJSON(){
		return prom.register.getMetricsAsJSON()
	},

	output(){
		return prom.register.metrics()
	}
}
