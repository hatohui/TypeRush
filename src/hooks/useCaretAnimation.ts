import { useEffect, useRef } from 'react'
import { Flip } from 'gsap/Flip'

interface UseCaretAnimationProps {
	caretIdx: number
	currentWordIdx: number
}

const useCaretAnimation = ({
	caretIdx,
	currentWordIdx,
}: UseCaretAnimationProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const caretRef = useRef<HTMLSpanElement | null>(null)

	// Animate caret
	useEffect(() => {
		const caretElement = caretRef.current
		if (!caretElement) return

		let target: HTMLElement | null = null
		if (caretIdx === -1) {
			target = containerRef.current?.querySelector(
				`[data-word="${currentWordIdx}"][data-char="0"]`
			) as HTMLElement | null

			if (target) {
				const state = Flip.getState(caretElement)
				target.parentNode?.insertBefore(caretElement, target)
				Flip.from(state, {
					duration: 0.4,
					ease: 'power1.inOut',
				})
			}
			return
		}

		target = containerRef.current?.querySelector(
			`[data-word="${currentWordIdx}"][data-char="${caretIdx}"]`
		) as HTMLElement | null

		if (!target) return

		const state = Flip.getState(caretElement)
		target.appendChild(caretElement)
		Flip.from(state, {
			duration: 0.15,
			ease: 'power1.inOut',
		})
	}, [currentWordIdx, caretIdx])

	// Initial caret positioning
	useEffect(() => {
		if (!containerRef.current) return

		requestAnimationFrame(() => {
			const caretElement = caretRef.current
			if (caretElement) {
				const target = containerRef.current?.querySelector(
					`[data-word="0"][data-char="0"]`
				) as HTMLElement | null

				if (target) {
					target.parentNode?.insertBefore(caretElement, target)
				}
			}
		})
	}, [])

	return {
		containerRef,
		caretRef,
	}
}
export default useCaretAnimation
