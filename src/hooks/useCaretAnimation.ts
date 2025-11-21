import { useEffect, useRef } from 'react'
import { Flip } from 'gsap/Flip'
import type { Socket } from 'socket.io-client'
import type { Player } from '../common/types.ts'

interface UseCaretAnimationProps {
	caretIdx: number
	currentWordIdx: number
	isMultiplayer: boolean
	socket: Socket | null
	players: Player[] | null
}

const useCaretAnimation = ({
	caretIdx,
	currentWordIdx,
	isMultiplayer,
	socket = null,
	players = null,
}: UseCaretAnimationProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const caretRef = useRef<HTMLSpanElement | null>(null)
	const caretRefs = useRef<(HTMLSpanElement | null)[]>([])

	// Animate self caret
	useEffect(() => {
		const caretElement = isMultiplayer ? caretRefs.current[3] : caretRef.current
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
	}, [currentWordIdx, caretIdx, isMultiplayer])

	// Initial practice mode caret positioning
	useEffect(() => {
		if (!containerRef.current || isMultiplayer) return

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
	}, [isMultiplayer])

	//MULTIPLAYER
	// Initialize caret refs
	useEffect(() => {
		if (!isMultiplayer) return
		caretRefs.current = Array.from({ length: 4 }, () => null)
	}, [isMultiplayer])

	// Animate opponent carets
	useEffect(() => {
		if (!socket || !isMultiplayer || !socket || !players) return

		const otherPlayers = players.filter(p => p.id !== socket.id)

		otherPlayers.forEach((player, playerIndex) => {
			const caretElement = caretRefs.current[playerIndex]
			if (!caretElement) return

			const caret = player.progress?.caret
			if (!caret) return

			const { caretIdx: playerCaretIdx, wordIdx: playerWordIdx } = caret
			let target: HTMLElement | null = null

			if (playerCaretIdx === -1) {
				target = containerRef.current?.querySelector(
					`[data-word="${playerWordIdx}"][data-char="0"]`
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
				`[data-word="${playerWordIdx}"][data-char="${playerCaretIdx}"]`
			) as HTMLElement | null

			if (!target) return

			const state = Flip.getState(caretElement)
			target.appendChild(caretElement)
			Flip.from(state, {
				duration: 0.4,
				ease: 'power1.inOut',
			})
		})
	}, [isMultiplayer, players, socket])

	// Initial caret positioning for all players
	useEffect(() => {
		if (!containerRef.current || !isMultiplayer || !socket || !players) return

		requestAnimationFrame(() => {
			// Position own caret
			const ownCaretElement = caretRefs.current[3]
			if (ownCaretElement) {
				const target = containerRef.current?.querySelector(
					`[data-word="0"][data-char="0"]`
				) as HTMLElement | null

				if (target) {
					target.parentNode?.insertBefore(ownCaretElement, target)
				}
			}

			// Position other players' carets
			if (!socket) return
			const otherPlayers = players.filter(p => p.id !== socket.id)

			otherPlayers.forEach((player, playerIndex) => {
				const caretElement = caretRefs.current[playerIndex]
				if (!caretElement) return

				const caret = player.progress?.caret
				const wordIdx = caret?.wordIdx ?? 0
				const caretIdx = caret?.caretIdx ?? -1

				let target: HTMLElement | null = null

				if (caretIdx === -1) {
					target = containerRef.current?.querySelector(
						`[data-word="${wordIdx}"][data-char="0"]`
					) as HTMLElement | null

					if (target) {
						target.parentNode?.insertBefore(caretElement, target)
					}
				} else {
					target = containerRef.current?.querySelector(
						`[data-word="${wordIdx}"][data-char="${caretIdx}"]`
					) as HTMLElement | null

					if (target) {
						target.appendChild(caretElement)
					}
				}
			})
		})
	}, [isMultiplayer])

	return {
		containerRef,
		caretRef,
		caretRefs,
	}
}
export default useCaretAnimation
