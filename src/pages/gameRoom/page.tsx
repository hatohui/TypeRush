import { useEffect, useState } from 'react'
import { useGameStore } from '../../stores/useGameStore.ts'
import JoinRoomModal from '../../components/JoinRoomModal.tsx'
import GameStartModal from '../../components/GameStartModal.tsx'
import { Button, type FormProps } from 'antd'
import { PiCrownFill } from 'react-icons/pi'
import GameFinishModalMultiplayer from '../../components/GameFinishModalMultiplayer.tsx'
import { SAMPLE_WORDS, WAVE_RUSH_WORDS } from '../../common/constant.ts'
import type { MultiplayerMode, FieldType } from '../../common/types.ts'
import LobbySettingsForm from '../../components/GameConfigForm.tsx'
import WaveRushGameContainer from '../../components/WaveRushGameContainer.tsx'
import MultiplayerGameContainer from '../../components/MultiplayerGameContainer.tsx'
import WaveRushResults from '../../components/PlayerWaveRushResult.tsx'

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
		displayFinishModal,
		setDisplayFinishModal,
		renderStartModal,
		isHost,
		stopGame,
		config,
		handleConfigChange,
		waveRushGameResult,
	} = useGameStore()
	const [open, setOpen] = useState(true)
	const [confirmLoading, setConfirmLoading] = useState(false)
	const [multiplayerMode, setMultiplayerMode] = useState<MultiplayerMode>(
		config?.mode ? config.mode : 'type-race'
	)

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

	const handleSaveConfig: FormProps<FieldType>['onFinish'] = values => {
		const waveRushWords: string[][] = []
		if (values.mode === 'wave-rush') {
			for (let i = 0; i < values.waves; i++) {
				waveRushWords.push(WAVE_RUSH_WORDS[i])
			}
		}

		const config =
			values.mode === 'type-race'
				? {
						mode: values.mode,
						words: ['hello'],
					}
				: {
						words: waveRushWords,
						mode: values.mode,
						duration: values.roundDuration,
						waves: values.waves,
						timeBetweenRounds: values.timeBetweenRounds,
					}
		handleConfigChange(config, roomId)
	}

	return (
		<div className='min-h-screen bg-[#383A3E] text-white flex flex-col'>
			<JoinRoomModal
				open={open}
				onOk={handleOk}
				confirmLoading={confirmLoading}
				error={error}
			/>

			<main className='flex flex-col gap-5 p-5'>
				<div className='flex w-full gap-5'>
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
						{config && (
							<LobbySettingsForm
								config={config}
								isHost={isHost}
								multiplayerMode={multiplayerMode}
								onModeChange={setMultiplayerMode}
								onSubmit={handleSaveConfig}
							/>
						)}
					</aside>
				</div>

				{roomId && isGameStarted && (
					<div className='flex w-full justify-center items-center'>
						{config && config.mode === 'wave-rush' && (
							<div className='w-full flex gap-5'>
								<aside className='w-[30%]'>
									<WaveRushResults
										results={waveRushGameResult}
										players={players}
									/>
								</aside>
								<div className='max-w-[1200px] min-w-[400px] flex justify-center'>
									<WaveRushGameContainer
										words={WAVE_RUSH_WORDS}
										roundDuration={config.duration}
									/>
								</div>
							</div>
						)}
						{config && config.mode === 'type-race' && (
							<MultiplayerGameContainer
								words={SAMPLE_WORDS}
								mode={'type-race'}
							/>
						)}
					</div>
				)}
			</main>

			{renderStartModal && <GameStartModal duration={3} />}

			{displayFinishModal && (
				<GameFinishModalMultiplayer
					setDisplayFinishModal={setDisplayFinishModal}
					displayFinishModal={displayFinishModal}
				/>
			)}
		</div>
	)
}

export default Page
