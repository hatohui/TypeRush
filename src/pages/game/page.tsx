import MainGameContainer from '../../components/MainGameContainer.tsx'

const words: string[] = [
	'umbrella',
	'night',
	'ocean',
	'kangaroo',
	'lion',
	'ant',
	'fish',
	'sun',
	'xylophone',
	'train',
	'hat',
]

const Page = () => {
	return (
		<div className='w-screen h-screen flex justify-center items-center'>
			<MainGameContainer words={words} mode={'practice'} />
		</div>
	)
}

export default Page
