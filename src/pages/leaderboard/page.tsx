import React, { useEffect, useState } from 'react'
import Container from '../../components/Container'
import type { LeaderboardData, LeaderboardEntry } from '../../common/types'

type LeaderboardType = 'all_time'
type LeaderboardMode = 15 | 30 | 60

const LeaderboardPage: React.FC = () => {
	const [leaderboardData, setLeaderboardData] =
		useState<LeaderboardData | null>(null)
	const [loading, setLoading] = useState(true)
	const [type] = useState<LeaderboardType>('all_time')
	const [mode, setMode] = useState<LeaderboardMode>(15)

	useEffect(() => {
		setLoading(true)

		const allMockData: LeaderboardData = {
			entries: [
				// Randomized entries across all modes
				{ user: { id: '1', playerName: 'SpeedTyper' }, wpm: 120, accuracy: 98, rawWpm: 122, mode: 15, recordedAt: new Date('2024-01-15') },
				{ user: { id: '11', playerName: 'ThunderType' }, wpm: 105, accuracy: 97, rawWpm: 108, mode: 30, recordedAt: new Date('2024-01-15') },
				{ user: { id: '21', playerName: 'MarathonTyper' }, wpm: 90, accuracy: 99, rawWpm: 91, mode: 60, recordedAt: new Date('2024-01-15') },
				{ user: { id: '2', playerName: 'FastFingers' }, wpm: 115, accuracy: 96, rawWpm: 119, mode: 15, recordedAt: new Date('2024-01-14') },
				{ user: { id: '22', playerName: 'EndurancePro' }, wpm: 85, accuracy: 98, rawWpm: 86, mode: 60, recordedAt: new Date('2024-01-14') },
				{ user: { id: '12', playerName: 'LightningHands' }, wpm: 100, accuracy: 95, rawWpm: 105, mode: 30, recordedAt: new Date('2024-01-14') },
				{ user: { id: '3', playerName: 'TypeMaster' }, wpm: 115, accuracy: 99, rawWpm: 111, mode: 15, recordedAt: new Date('2024-01-13') },
				{ user: { id: '23', playerName: 'SteadyHands' }, wpm: 82, accuracy: 97, rawWpm: 84, mode: 60, recordedAt: new Date('2024-01-13') },
				{ user: { id: '13', playerName: 'FlashTyper' }, wpm: 95, accuracy: 98, rawWpm: 97, mode: 30, recordedAt: new Date('2024-01-13') },
				{ user: { id: '4', playerName: 'KeyboardNinja' }, wpm: 105, accuracy: 97, rawWpm: 108, mode: 15, recordedAt: new Date('2024-01-12') },
				{ user: { id: '24', playerName: 'PersistentKeys' }, wpm: 80, accuracy: 96, rawWpm: 83, mode: 60, recordedAt: new Date('2024-01-12') },
				{ user: { id: '14', playerName: 'RocketFingers' }, wpm: 92, accuracy: 94, rawWpm: 97, mode: 30, recordedAt: new Date('2024-01-12') },
				{ user: { id: '5', playerName: 'QuickTyper' }, wpm: 102, accuracy: 95, rawWpm: 107, mode: 15, recordedAt: new Date('2024-01-11') },
				{ user: { id: '15', playerName: 'TurboKeys' }, wpm: 88, accuracy: 96, rawWpm: 91, mode: 30, recordedAt: new Date('2024-01-11') },
				{ user: { id: '25', playerName: 'LongDistance' }, wpm: 78, accuracy: 95, rawWpm: 82, mode: 60, recordedAt: new Date('2024-01-11') },
				{ user: { id: '6', playerName: 'TypingPro' }, wpm: 98, accuracy: 94, rawWpm: 104, mode: 15, recordedAt: new Date('2024-01-10') },
				{ user: { id: '26', playerName: 'StaminaMaster' }, wpm: 75, accuracy: 94, rawWpm: 79, mode: 60, recordedAt: new Date('2024-01-10') },
				{ user: { id: '16', playerName: 'NitroTypist' }, wpm: 85, accuracy: 93, rawWpm: 91, mode: 30, recordedAt: new Date('2024-01-10') },
				{ user: { id: '7', playerName: 'WordWizard' }, wpm: 95, accuracy: 93, rawWpm: 102, mode: 15, recordedAt: new Date('2024-01-09') },
				{ user: { id: '17', playerName: 'VelocityPro' }, wpm: 82, accuracy: 92, rawWpm: 89, mode: 30, recordedAt: new Date('2024-01-09') },
				{ user: { id: '27', playerName: 'ConsistentTyper' }, wpm: 72, accuracy: 93, rawWpm: 77, mode: 60, recordedAt: new Date('2024-01-09') },
				{ user: { id: '8', playerName: 'RapidKeys' }, wpm: 92, accuracy: 92, rawWpm: 100, mode: 15, recordedAt: new Date('2024-01-08') },
				{ user: { id: '28', playerName: 'StableFingers' }, wpm: 70, accuracy: 92, rawWpm: 76, mode: 60, recordedAt: new Date('2024-01-08') },
				{ user: { id: '18', playerName: 'BlazeType' }, wpm: 80, accuracy: 91, rawWpm: 87, mode: 30, recordedAt: new Date('2024-01-08') },
				{ user: { id: '9', playerName: 'SwiftTypist' }, wpm: 88, accuracy: 91, rawWpm: 96, mode: 15, recordedAt: new Date('2024-01-07') },
				{ user: { id: '19', playerName: 'JetTyper' }, wpm: 78, accuracy: 90, rawWpm: 86, mode: 30, recordedAt: new Date('2024-01-07') },
				{ user: { id: '29', playerName: 'ReliableKeys' }, wpm: 68, accuracy: 91, rawWpm: 74, mode: 60, recordedAt: new Date('2024-01-07') },
				{ user: { id: '10', playerName: 'SpeedDemon' }, wpm: 85, accuracy: 90, rawWpm: 94, mode: 15, recordedAt: new Date('2024-01-06') },
				{ user: { id: '20', playerName: 'AceKeys' }, wpm: 75, accuracy: 89, rawWpm: 84, mode: 30, recordedAt: new Date('2024-01-06') },
				{ user: { id: '30', playerName: 'DurableTypist' }, wpm: 65, accuracy: 90, rawWpm: 72, mode: 60, recordedAt: new Date('2024-01-06') },
			],
			totalEntries: 30,
		}

		setTimeout(() => {
			// Filter entries by selected mode and sort by WPM (desc) then date (asc)
			const filteredEntries = allMockData.entries
				.filter(entry => entry.mode === mode)
				.sort((a, b) => {
					// Primary sort: WPM descending (higher is better)
					if (b.wpm !== a.wpm) {
						return b.wpm - a.wpm
					}
					// Tiebreaker: Earlier date wins (older date = higher rank)
					return a.recordedAt.getTime() - b.recordedAt.getTime()
				})

			setLeaderboardData({
				entries: filteredEntries,
				totalEntries: filteredEntries.length,
			})
			setLoading(false)
		}, 500)
	}, [type, mode])

	if (loading) {
		return (
			<Container>
				<div className='loading'>Loading leaderboard...</div>
			</Container>
		)
	}

	return (
		<Container>
			<div className='leaderboard'>
				<h1>Leaderboard - All Time</h1>
				<div className='leaderboard-container'>
					<div className='leaderboard-sidebar'>
						<div className='leaderboard-modes'>
							<button
								className={mode === 15 ? 'mode-btn active' : 'mode-btn'}
								onClick={() => setMode(15)}
							>
								15s
							</button>
							<button
								className={mode === 30 ? 'mode-btn active' : 'mode-btn'}
								onClick={() => setMode(30)}
							>
								30s
							</button>
							<button
								className={mode === 60 ? 'mode-btn active' : 'mode-btn'}
								onClick={() => setMode(60)}
							>
								60s
							</button>
						</div>
					</div>
					<div className='leaderboard-content'>
						<div className='leaderboard-entries'>
							{leaderboardData?.entries.map((entry, index) => (
								<div key={entry.user.id} className='leaderboard-entry'>
									<div className='entry-rank'>#{index + 1}</div>
									<div className='entry-name'>{entry.user.playerName}</div>
									<div className='entry-stats'>
										WPM: {entry.wpm} | Raw: {entry.rawWpm} | ACC: {entry.accuracy}% | Date: {entry.recordedAt.toLocaleDateString()}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</Container>
	)
}

export default LeaderboardPage
