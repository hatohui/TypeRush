import { Card, Modal } from 'antd'
import { useGameStore } from '../stores/useGameStore.ts'

interface GameFinishModalProps {
	displayFinishModal: boolean
	setDisplayFinishModal: (displayFinishModal: boolean) => void
}

const GameFinishModal = ({
	displayFinishModal,
	setDisplayFinishModal,
}: GameFinishModalProps) => {
	const { leaderboard, players } = useGameStore()

	const getPositionStyle = (position: number) => {
		if (position === 0) {
			return 'text-3xl font-bold text-amber-300'
		} else if (position === 1) {
			return 'text-3xl font-bold text-gray-300'
		} else if (position === 2) {
			return 'text-3xl font-bold text-brown-300'
		} else if (position === 3) {
			return 'text-3xl font-bold text-red-300'
		}
	}

	return (
		<Modal
			open={displayFinishModal}
			onCancel={() => setDisplayFinishModal(false)}
			title='Results'
			footer={null}
		>
			{leaderboard &&
				leaderboard.map((entry, idx) => {
					const player = players.find(player => player.id === entry.playerId)
					console.log(player?.playerName)
					return (
						<Card key={entry.playerId} className='mb-4'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-4'>
									<span className={getPositionStyle(idx)}>#{idx + 1}</span>
									<div>
										<div className='font-semibold text-lg'>
											{player?.playerName}
										</div>
										<div className='text-gray-500 text-sm'>
											Accuracy: {entry.stats.accuracy.toFixed(1)}% | WPM:{' '}
											{entry.stats.wpm}
										</div>
									</div>
								</div>
								<div className='text-right'>
									<div className='text-sm text-gray-500'>
										Raw WPM: {entry.stats.rawWpm}
									</div>
									<div className='text-xs text-gray-400'>
										{entry.stats.correct} correct / {entry.stats.incorrect}{' '}
										incorrect
									</div>
								</div>
							</div>
						</Card>
					)
				})}
		</Modal>
	)
}

export default GameFinishModal
