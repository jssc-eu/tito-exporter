const next = require('next')
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const routeCache = require('route-cache');

const cors = require('cors')

const router = require('./router')
const errorHandler = require('./errorHandler')
const orderHandler = require('./orderHandler')

const dev = process.env.NODE_ENV !== 'production'

module.exports = function (getRoutes, config) {
	const nextApp = next({ dev, conf: config })
	const handle = nextApp.getRequestHandler()
	const nextConfig = nextApp.nextConfig

	const initNext = () => {

		const app = express()
		const server = require('http').Server(app)

		app.use(cookieParser())
		app.routeCache = routeCache

		return {
			app,
			server
		}
	}

	const attachRoutes = ({ app, server }) => {
		const jsonParser = bodyParser.json()

		app.use('/api/*', express.json())
		app.get('/api/orders', jsonParser, orderHandler.get)


		return { app, server }
	}

	const attachNextRoutes = ({ app, server }) => {
		const routes = router(nextApp, getRoutes)

		app.use('/', routes)
		app.get('*', (req, res) => handle(req, res))

		return { app, server }
	}

	const startServer = ({ app, server }) => {
		const { port } = config

		server.listen(port, (err) => {
			if (err) throw err
			console.log(`> Ready on http://0.0.0.0:${port}`)
		})
	}



	return nextApp.prepare()
		.then(initNext)
		.then(attachRoutes)
		.then(attachNextRoutes)
		.then(startServer)
		.catch(errorHandler)
}
