// WaveRushGameContainer.tsx
import MultiplayerGameContainer from './MultiplayerGameContainer.tsx'
import { useWaveRushGame } from '../hooks/useWaveRushLogic.ts'
import type { Socket } from 'socket.io-client'

interface WaveRushGameContainerProps {
	words: string[][]
	roundDuration: number
	socket: Socket | null
}

const WaveRushGameContainer = ({
	words,
	roundDuration,
}: WaveRushGameContainerProps) => {
	const {
		handleRoundComplete,
		handleNextRound,
		isRoundComplete,
		currentWords,
		currentRound,
		setIsRoundComplete,
	} = useWaveRushGame(words)

	return (
		<div>
			<div className='text-white mb-4'>
				Round {currentRound + 1} / {words.length}
			</div>

			<MultiplayerGameContainer
				key={currentRound}
				mode='wave-rush'
				words={currentWords}
				waveRushMode={{
					roundDuration,
					onRoundComplete: handleRoundComplete,
					timeBetweenRound: 3,
					isRoundComplete,
					handleNextRound,
					currentRound: currentRound + 1,
					setIsRoundComplete,
				}}
			/>
		</div>
	)
}

export default WaveRushGameContainer
