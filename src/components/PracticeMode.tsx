import { useState } from 'react'
import type { GameDuration } from '../common/types.ts'
import ModeBar from './modeBar.tsx'
import MainGameContainer from './MainGameContainer.tsx'
import { SAMPLE_WORDS } from '../common/constant.ts'

const PracticeMode = () => {
	const [selectedDuration, setSelectedDuration] = useState<GameDuration>(0)
	return (
		<div className='w-full h-full flex flex-col justify-center items-center'>
			<ModeBar
				selectedDuration={selectedDuration}
				setSelectedDuration={setSelectedDuration}
			/>
			<MainGameContainer
				words={SAMPLE_WORDS}
				mode={'practice'}
				duration={selectedDuration}
			/>
		</div>
	)
}

export default PracticeMode
