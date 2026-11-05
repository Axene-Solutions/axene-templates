/**
 * Interface icons: Iconsax, rounded shape, two-tone variant.
 * Each file in ./svg is a vendored copy of the library SVG, renamed to a
 * semantic name. Nothing here reads from the source library at runtime.
 * Directional icons are chevrons only (arrow-down4, arrow-up3, arrow-left4, arrow-right4).
 */

import alignCenter from './svg/align-center.svg?raw'
import alignLeft from './svg/align-left.svg?raw'
import alignRight from './svg/align-right.svg?raw'
import bag from './svg/bag.svg?raw'
import box from './svg/box.svg?raw'
import chevronDown from './svg/chevron-down.svg?raw'
import chevronLeft from './svg/chevron-left.svg?raw'
import chevronRight from './svg/chevron-right.svg?raw'
import chevronUp from './svg/chevron-up.svg?raw'
import clock from './svg/clock.svg?raw'
import close from './svg/close.svg?raw'
import code from './svg/code.svg?raw'
import copy from './svg/copy.svg?raw'
import download from './svg/download.svg?raw'
import edit from './svg/edit.svg?raw'
import eye from './svg/eye.svg?raw'
import grid from './svg/grid.svg?raw'
import home from './svg/home.svg?raw'
import image from './svg/image.svg?raw'
import link from './svg/link.svg?raw'
import logout from './svg/logout.svg?raw'
import mobile from './svg/mobile.svg?raw'
import monitor from './svg/monitor.svg?raw'
import moon from './svg/moon.svg?raw'
import more from './svg/more.svg?raw'
import pencil from './svg/pencil.svg?raw'
import plus from './svg/plus.svg?raw'
import pointer from './svg/pointer.svg?raw'
import redo from './svg/redo.svg?raw'
import refresh from './svg/refresh.svg?raw'
import search from './svg/search.svg?raw'
import send from './svg/send.svg?raw'
import settings from './svg/settings.svg?raw'
import sun from './svg/sun.svg?raw'
import trash from './svg/trash.svg?raw'
import undo from './svg/undo.svg?raw'
import user from './svg/user.svg?raw'
import warning from './svg/warning.svg?raw'

export const icons = {
	'align-center': alignCenter,
	'align-left': alignLeft,
	'align-right': alignRight,
	bag: bag,
	box: box,
	'chevron-down': chevronDown,
	'chevron-left': chevronLeft,
	'chevron-right': chevronRight,
	'chevron-up': chevronUp,
	clock: clock,
	close: close,
	code: code,
	copy: copy,
	download: download,
	edit: edit,
	eye: eye,
	grid: grid,
	home: home,
	image: image,
	link: link,
	logout: logout,
	mobile: mobile,
	monitor: monitor,
	moon: moon,
	more: more,
	pencil: pencil,
	plus: plus,
	pointer: pointer,
	redo: redo,
	refresh: refresh,
	search: search,
	send: send,
	settings: settings,
	sun: sun,
	trash: trash,
	undo: undo,
	user: user,
	warning: warning,
} as const

export type IconName = keyof typeof icons
