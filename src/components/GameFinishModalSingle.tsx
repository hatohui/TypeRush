import type { PlayerStats } from '../common/types.ts'
import React from 'react'
import { Modal } from 'antd'

interface GameFinishModalPracticeProps {
	onCancel: (isBetweenRounds: boolean) => void
	footer: React.ReactNode
	title: string
	playerStats: PlayerStats | null
	isMultiplayer: boolean
	position?: number | null
}

const GameFinishModalSingle = ({
	onCancel,
	footer,
	title,
	playerStats,
	isMultiplayer,
	position,
}: GameFinishModalPracticeProps) => {
	return (
		<Modal
			open={!!playerStats}
			onCancel={() => onCancel(false)}
			footer={[footer]}
			title={title}
		>
			{playerStats && (
				<div>
					<p>Accuracy: {playerStats.accuracy.toFixed(1)}%</p>
					<p>WPM: {playerStats.wpm.toFixed(1)}</p>
					<p>Raw WPM: {playerStats.rawWpm.toFixed(1)}</p>
					<p>Correct chars: {playerStats.correct}</p>
					<p>Incorrect chars: {playerStats.incorrect}</p>
					<p>Overflow chars: {playerStats.overflow}</p>
					<p>Missed chars: {playerStats.missed}</p>
					<p>Time elapsed: {playerStats.timeElapsed}</p>
				</div>
			)}
			{isMultiplayer && typeof position === 'number' && (
				<p>Position: {position + 1}</p>
			)}
		</Modal>
	)
}

export default GameFinishModalSingle
