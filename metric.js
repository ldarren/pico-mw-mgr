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
			labelNames: ['method', 'path', 'mw']
		})
	},

	startTimer(metric, method, path, mw){
		if (!metric) throw 'invalid metric name: ' + metric.name
		return metric.startTimer({method, path, mw})
	},

	contentType(){
		return prom.register.contentType
	},

	output(){
		return prom.register.getMetricsAsJSON()
	}
}
