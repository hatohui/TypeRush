import React from 'react'

interface TypingAreaProps {
	localWords: string[]
	currentWord: string | null
	typed: string
	onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
	getCharStyle: (wordIdx: number, charIdx: number, char: string) => string
}

const TypingArea = ({
	localWords,
	currentWord,
	typed,
	onKeyDown,
	getCharStyle,
}: TypingAreaProps) => {
	return (
		<>
			{localWords?.map((word, wordIdx) => (
				<span key={wordIdx}>
					{word === currentWord && (
						<input
							className='text-3xl opacity-0 absolute flex focus:outline-none focus:ring-0 focus:border-transparent'
							autoFocus
							type='text'
							value={typed}
							onKeyDown={e => {
								onKeyDown(e)
							}}
						/>
					)}
					{word?.split('').map((char, charIdx) => {
						const state = getCharStyle(wordIdx, charIdx, char)
						return (
							<span
								key={charIdx}
								className={state}
								data-word={wordIdx}
								data-char={charIdx}
							>
								{char}
							</span>
						)
					})}
				</span>
			))}
		</>
	)
}

export default TypingArea
