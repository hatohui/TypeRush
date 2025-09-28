import { useEffect, useState } from 'react'
import { useGameStore } from '../../stores/useGameStore.ts'
import JoinRoomModal from '../../components/joinRoomModal.tsx'

const Page = () => {
	const {
		connect,
		createRoom,
		joinRoom,
		connected,
		roomId,
		players,
		config,
		error,
		updateSharedTextbox,
		currentText,
	} = useGameStore()
	const [open, setOpen] = useState(true)
	const [confirmLoading, setConfirmLoading] = useState(false)

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
									<div className='h-28 bg-gray-200 rounded-xl p-5 text-black'>
										Player: {player.name}
									</div>
								))}
						</div>
					</div>

					<div className='flex justify-center mt-8'>
						<button className='bg-gray-200 text-black px-8 py-2 rounded'>
							START
						</button>
					</div>
				</div>

				<aside className='w-80 p-6 bg-[#414246]'>
					<h2 className='text-sm font-semibold'>Lobby Settings</h2>
				</aside>
			</main>

			{roomId && (
				<input
					type='text'
					className='border border-black'
					onChange={e => updateSharedTextbox(e.target.value, roomId)}
					value={currentText}
				/>
			)}
		</div>
	)
}

export default Page
