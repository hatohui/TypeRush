import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface SettingState {
	fontFamily: string
	fontSize: number
	backgroundColor: string
	textColor: string
	darkMode: boolean
	toggleDarkMode: () => void
	changeFontFamily: (fontFamily: string) => void
	changeFontSize: (fontSize: number) => void
	changeBackgroundColor: (backgroundColor: string) => void
	changeTextColor: (textColor: string) => void
}

const useSettingStore = create<SettingState>()(
	persist(
		set => ({
			fontFamily: 'monospace',
			fontSize: 14,
			backgroundColor: '#ffffff',
			textColor: '#000000',
			darkMode: false,
			toggleDarkMode: () => set(state => ({ darkMode: !state.darkMode })),
			changeFontFamily: (fontFamily: string) => set({ fontFamily }),
			changeFontSize: (fontSize: number) => set({ fontSize }),
			changeBackgroundColor: (backgroundColor: string) =>
				set({ backgroundColor }),
			changeTextColor: (textColor: string) => set({ textColor }),
		}),
		{
			name: 'type-rush-settings',
			storage: createJSONStorage(() => localStorage),
			partialize: state => ({
				fontFamily: state.fontFamily,
				fontSize: state.fontSize,
				backgroundColor: state.backgroundColor,
				textColor: state.textColor,
				darkMode: state.darkMode,
			}),
		}
	)
)

export const useUISettings = () => {
	const fontFamily = useSettingStore(state => state.fontFamily)
	const fontSize = useSettingStore(state => state.fontSize)
	const backgroundColor = useSettingStore(state => state.backgroundColor)
	const textColor = useSettingStore(state => state.textColor)
	const darkMode = useSettingStore(state => state.darkMode)

	return { fontFamily, fontSize, backgroundColor, textColor, darkMode }
}

export default useSettingStore
