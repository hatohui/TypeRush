import { useEffect, useState } from 'react'
import { useGameStore } from '../../stores/useGameStore.ts'
import JoinRoomModal from '../../components/JoinRoomModal.tsx'
import MainGameContainer from '../../components/MainGameContainer.tsx'
import GameStartModal from '../../components/gameStartModal.tsx'
import { Button } from 'antd'
import { PiCrownFill } from 'react-icons/pi'

const words: string[] = [
	'umbrella',
	'night',
	'ocean',
	// 'kangaroo',
	// 'lion',
	// 'ant',
	// 'fish',
	// 'sun',
	// 'xylophone',
	// 'train',
	// 'hat',
	// 'mountain',
	// 'village',
]

const Page = () => {
	const {
		connect,
		createRoom,
		joinRoom,
		connected,
		roomId,
		players,
		error,
		isGameStarted,
		startGame,
	} = useGameStore()
	const [open, setOpen] = useState(true)
	const [confirmLoading, setConfirmLoading] = useState(false)
	const { renderStartModal, isHost, stopGame } = useGameStore()

	const handleOk = (values: { playerName: string; roomId?: string }) => {
		setConfirmLoading(true)

		connect()

		if (values.roomId) {
			joinRoom(values.roomId, values.playerName)
		} else {
			createRoom(values.playerName)
		}
	}

	useEffect(() => {
		if (connected && roomId && error.type === '') {
			setConfirmLoading(false)
			setOpen(false)
		}
		if (error.type !== '') {
			setConfirmLoading(false)
		}
	}, [connected, error, roomId])

	return (
		<div className='min-h-screen bg-[#383A3E] text-white flex flex-col'>
			<JoinRoomModal
				open={open}
				onOk={handleOk}
				confirmLoading={confirmLoading}
				error={error}
			/>

			<header className='bg-gray-800 px-6 py-4 flex justify-between items-center'>
				<h1 className='text-2xl font-bold text-white'>
					<span className='text-white'>Type</span>
					<span className='text-blue-500'>Rush</span>
				</h1>

				<div className='flex items-center gap-4'>
					<nav className='flex gap-3'>
						<button className='bg-gray-700 px-3 py-1 rounded'>stats</button>
						<button className='bg-gray-700 px-3 py-1 rounded'>settings</button>
					</nav>
					<div className='w-5 h-5 rounded-full bg-blue-500' />
				</div>
			</header>

			<main className='flex gap-5 p-5'>
				<div className='flex-1 p-6 flex flex-col bg-[#414246] justify-between'>
					<div>
						<p>Room id: {roomId}</p>
						<p className='mb-6'>{players.length}/4</p>
						<div className='grid grid-cols-2 gap-6'>
							{players &&
								players.map(player => (
									<div
										key={player.id}
										className='h-28 bg-gray-200 rounded-xl p-5 text-black'
									>
										Player: {player.playerName}
										{player.isHost && <PiCrownFill className='inline ml-1' />}
									</div>
								))}
						</div>
					</div>

					{isHost && (
						<div className='flex justify-center mt-8 gap-5'>
							<Button
								onClick={() => {
									startGame(roomId)
								}}
								type='primary'
								disabled={isGameStarted}
							>
								START
							</Button>
							<Button danger type='primary' onClick={() => stopGame(roomId)}>
								STOP
							</Button>
						</div>
					)}
				</div>

				<aside className='w-80 p-6 bg-[#414246]'>
					<h2 className='text-sm font-semibold'>Lobby Settings</h2>
				</aside>
			</main>

			{renderStartModal && <GameStartModal duration={3} />}

			{roomId && words && isGameStarted && (
				<MainGameContainer words={words} mode={'multiplayer'} />
			)}
		</div>
	)
}

export default Page
