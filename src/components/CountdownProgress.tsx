import { Progress } from 'antd'

const CountdownProgress = ({
	duration,
	timeElapsed,
}: {
	duration: number
	timeElapsed: number
}) => {
	const remainingTime = Math.max(0, duration - timeElapsed)
	const percent = duration > 0 ? (remainingTime / duration) * 100 : 0

	// Format display based on whether we have decimal precision
	const displayTime =
		remainingTime % 1 === 0
			? `${remainingTime}s`
			: `${remainingTime.toFixed(1)}s`

	return (
		<Progress
			percent={percent}
			format={() => (
				<span className='font-bold text-accent-primary text-lg'>
					{displayTime}
				</span>
			)}
			status={remainingTime === 0 ? 'exception' : 'active'}
		/>
	)
}

export default CountdownProgress
