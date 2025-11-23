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
	const { handleRoundComplete, currentWords, currentRound } =
		useWaveRushGame(words)

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
					currentRound: currentRound + 1,
				}}
			/>
		</div>
	)
}

export default WaveRushGameContainer
