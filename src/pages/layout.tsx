import React from 'react'
import NavBar from '../components/NavBar'
import { useUISettings } from '../stores/useSettingStore'

const MainLayout = ({
	children,
}: {
	children: React.ReactNode
}): React.ReactNode => {
	const uiSettings = useUISettings()

	return (
		<div style={uiSettings}>
			<NavBar />
			<div>{children}</div>
			<div>Footer</div>
		</div>
	)
}

export default MainLayout
