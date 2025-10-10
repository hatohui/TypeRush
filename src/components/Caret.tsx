import { forwardRef } from 'react'

interface CaretProps {
	isOpponent?: boolean
	playerName?: string
	color?: string
	className?: string
}

const Caret = forwardRef<HTMLSpanElement, CaretProps>(
	({ isOpponent = false, playerName = 'Player', color = '#3b82f6', className= '' }, ref) => {
		return (
			<span className={`relative inline-block ${className}`} ref={ref}>
				<span
					className='inline-block w-[1.5px] animate-pulse align-text-bottom'
					style={{
						backgroundColor: color,
						height: '1em',
						marginLeft: '-1px',
					}}
				/>

				{isOpponent && (
					<span
						className='absolute -top-4 left-0 text-xs px-2 py-1 rounded whitespace-nowrap shadow-sm'
						style={{
							backgroundColor: color,
							color: 'white',
							fontSize: '10px',
							transform: 'translateX(-50%)',
						}}
					>
						{playerName}
					</span>
				)}
			</span>
		)
	}
)

Caret.displayName = 'Caret'

export default Caret
