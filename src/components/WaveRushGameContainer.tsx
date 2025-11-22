// WaveRushGameContainer.tsx
import { useState } from 'react'
import MultiplayerGameContainer from './MultiplayerGameContainer.tsx'
import { useWaveRushGame } from '../hooks/useWaveRushLogic.ts'

interface WaveRushGameContainerProps {
	words: string[][]
	roundDuration: number
	numberOfRounds: number
}

const WaveRushGameContainer = ({
	words,
	roundDuration,
	numberOfRounds,
}: WaveRushGameContainerProps) => {
	const {
		roundResults,
		addRoundResult,
		getLeaderboard,
		handleRoundComplete,
		handleNextRound,
		isLastRound,
		isRoundComplete,
		currentWords,
		// removePlayer,
		resetGame,
		currentRound,
		setIsRoundComplete,
	} = useWaveRushGame(words)

	return (
		<div>
			<div className='text-white mb-4'>
				Round {currentRound + 1} / {words.length}
			</div>

			<MultiplayerGameContainer
				mode='wave-rush'
				words={currentWords}
				onRoundComplete={handleRoundComplete}
				roundDuration={roundDuration}
				isRoundComplete={isRoundComplete}
				handleNextRound={handleNextRound}
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
