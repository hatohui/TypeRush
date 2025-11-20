import { type MainGameContainerProps, TypingMode } from '../common/types.ts'
import PracticeGameContainer from './PracticeGameContainer.tsx'
import MultiplayerGameContainer from './MultiplayerGameContainer.tsx'

const MainGameContainer = ({ words, mode, duration }: MainGameContainerProps) => {
	if (mode === TypingMode.PRACTICE) {
		return <PracticeGameContainer words={words} duration={duration} />
	}

	return <MultiplayerGameContainer words={words} />
}

export default MainGameContainer
