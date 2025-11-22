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
	socket,
}: WaveRushGameContainerProps) => {
	const {
		handleRoundComplete,
		handleNextRound,
		isRoundComplete,
		currentWords,
		currentRound,
		getCurrentRoundResult,
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
					currentRoundResult: getCurrentRoundResult(socket?.id),
					currentRound: currentRound + 1,
				}}
			/>
		</div>
	)
}

export default WaveRushGameContainer
