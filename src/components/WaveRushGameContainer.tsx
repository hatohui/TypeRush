// WaveRushGameContainer.tsx
import MultiplayerGameContainer from './MultiplayerGameContainer.tsx'
import { useWaveRushGame } from '../hooks/useWaveRushLogic.ts'

interface WaveRushGameContainerProps {
	words: string[][]
	roundDuration: number
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
	} = useWaveRushGame(words)

	return (
		<div>
			<div className='text-white mb-4'>
				Round {currentRound + 1} / {words.length}
			</div>

			<MultiplayerGameContainer
				key={currentRound} // Force remount on round change
				mode='wave-rush'
				words={currentWords}
				waveRushMode={{
					roundDuration,
					onRoundComplete: handleRoundComplete,
					timeBetweenRound: 3,
					isRoundComplete,
					handleNextRound,
				}}
			/>

			{/*{isRoundComplete && !isLastRound && (*/}
			{/*	<RoundCompleteModal*/}
			{/*		roundScore={roundResults[currentRound]}*/}
			{/*		onNext={handleNextRound}*/}
			{/*	/>*/}
			{/*)}*/}

			{/*{isRoundComplete && isLastRound && (*/}
			{/*	<GameCompleteModal*/}
			{/*		allScores={roundResults}*/}
			{/*		onClose={handleGameComplete}*/}
			{/*	/>*/}
			{/*)}*/}
		</div>
	)
}

export default WaveRushGameContainer
