import { useRef, useState } from 'react'

const MainGameContainer = () => {
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
		'mountain',
		'village',
		'ice',
		'frog',
		'yacht',
		'quilt',
		'zebra',
		'gold',
		'juice',
		'river',
		'cat',
		'lemon',
		'dog',
		'egg',
		'xenon',
		'ball',
		'road',
		'unicorn',
		'pear',
		'zoo',
		'orange',
		'violet',
		'star',
		'island',
		'desk',
		'elephant',
		'grape',
		'queen',
		'nest',
		'yellow',
		'wolf',
		'tree',
		'house',
		'banana',
		'cherry',
		'pumpkin',
		'jungle',
		'monkey',
		'kite',
	]
	const [currentWordIdx, setCurrentWordIdx] = useState(0)
	const [currentWord, setCurrentWord] = useState<string | null>(
		words[currentWordIdx]
	)
	const [typed, setTyped] = useState<string>('')
	const [wordResults, setWordResults] = useState<Record<number, string[]>>({})
	const containerRef = useRef<HTMLDivElement>(null)

	const handleSpacePress = () => {
		if (typed.trim() === '') return
		const currentResults = words[currentWordIdx].split('').map((char, idx) => {
			if (idx < typed.length) {
				return typed[idx] === char ? 'correct' : 'incorrect'
			}
			return 'untyped'
		})

		setWordResults(prev => ({
			...prev,
			[currentWordIdx]: currentResults,
		}))

		setCurrentWordIdx(prev => {
			const nextIdx = prev + 1
			setCurrentWord(words[nextIdx] ?? null)
			return nextIdx
		})
		setTyped('')
	}

	return (
		<div>
			<p>Current id: {currentWordIdx}</p>
			<p>Current word: {currentWord}</p>
			<p>Typed: {typed}</p>
			<p>Typed length: {typed?.length}</p>
			<div
				ref={containerRef}
				tabIndex={0}
				className='h-[400px] text-gray-500 w-[900px] border border-black p-10 flex flex-wrap'
			>
				{words.map((word, wordIdx) => (
					<span
						className={`mr-2 text-3xl ${currentWord === word ? 'text-black' : ''}`}
						key={wordIdx}
					>
						{word === currentWord && (
							<input
								className='text-3xl text-transparent caret-white absolute flex focus:outline-none focus:ring-0 focus:border-transparent'
								autoFocus
								type='text'
								value={typed}
								onKeyDown={e => {
									if (e.key === ' ') {
										e.preventDefault()
										handleSpacePress()
									}
									if (
										e.key === 'Tab' ||
										e.key === 'Enter' ||
										[
											'ArrowUp',
											'ArrowDown',
											'ArrowLeft',
											'ArrowRight',
										].includes(e.key)
									) {
										e.preventDefault()
									}
								}}
								onChange={e => {
									const value = e.target.value.replace(/ /g, '')
									setTyped(value)
								}}
							/>
						)}
						{word.split('').map((char, idx) => {
							let state = ''
							if (wordIdx < currentWordIdx) {
								const storedResults = wordResults[wordIdx]
								if (storedResults && storedResults[idx]) {
									state =
										storedResults[idx] === 'correct'
											? 'text-white'
											: storedResults[idx] === 'incorrect'
												? 'text-red-500'
												: ''
								}
							} else if (wordIdx === currentWordIdx) {
								if (idx < typed.length) {
									state = typed[idx] === char ? 'text-white' : 'text-red-500'
								}
							}
							return (
								<span key={idx} className={state}>
									{char}
								</span>
							)
						})}
					</span>
				))}
			</div>
		</div>
	)
}

export default MainGameContainer
