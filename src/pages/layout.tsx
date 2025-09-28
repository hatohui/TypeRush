import React from 'react'
import NavBar from '../components/NavBar'

const MainLayout = ({
	children,
}: {
	children: React.ReactNode
}): React.ReactNode => {
	return (
		<div>
			<NavBar />
			<div>{children}</div>
			<div>Footer</div>
		</div>
	)
}

export default MainLayout
