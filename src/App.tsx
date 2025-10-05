import React from 'react'
import registerGSAPPlugins from './config/registerGSAPPlugins'
import { RouterProvider } from 'react-router'
import router from './config/dynamicRouter'

const App = (): React.ReactNode => {
	registerGSAPPlugins()

	return <RouterProvider router={router} />
}

export default App
