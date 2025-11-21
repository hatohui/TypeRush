import { useState } from 'react'
import type { GameDuration } from '../common/types.ts'
import ModeBar from './modeBar.tsx'
import { SAMPLE_WORDS } from '../common/constant.ts'
import PracticeGameContainer from './PracticeGameContainer.tsx'

const PracticeMode = () => {
	const [selectedDuration, setSelectedDuration] = useState<GameDuration>(0)
	return (
		<div className='w-full h-full flex flex-col justify-center items-center'>
			<ModeBar
				selectedDuration={selectedDuration}
				setSelectedDuration={setSelectedDuration}
			/>
			<PracticeGameContainer words={SAMPLE_WORDS} duration={selectedDuration} />
		</div>
	)
}

export default PracticeMode
