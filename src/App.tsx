import React from 'react'
import registerGSAPPlugins from './config/registerGSAPPlugins'
import { RouterProvider } from 'react-router'
import router from './config/dynamicRouter'
import { io } from 'socket.io-client'

const App = (): React.ReactNode => {
	registerGSAPPlugins()

	const socket = io()

	return <RouterProvider router={router} />
}

export default App
