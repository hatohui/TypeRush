import type { SingleplayerResultType } from '../common/types.ts'
import React from 'react'
import { Modal } from 'antd'

interface GameFinishModalPracticeProps {
	onCancel: () => void
	footer: React.ReactNode
	title: string
	results: SingleplayerResultType
	isMultiplayer: boolean
	position?: number | null
}

const GameFinishModalSingle = ({
	onCancel,
	footer,
	title,
	results,
	isMultiplayer,
	position,
}: GameFinishModalPracticeProps) => {
	return (
		<Modal open={!!results} onCancel={onCancel} footer={[footer]} title={title}>
			{results && (
				<div>
					<p>Accuracy: {results.accuracy.toFixed(1)}%</p>
					<p>WPM: {results.wpm.toFixed(1)}</p>
					<p>Raw WPM: {results.rawWpm.toFixed(1)}</p>
					<p>Correct chars: {results.correct}</p>
					<p>Incorrect chars: {results.incorrect}</p>
				</div>
			)}
			{isMultiplayer && typeof position === 'number' && (
				<p>Position: {position + 1}</p>
			)}
		</Modal>
	)
}

export default GameFinishModalSingle
