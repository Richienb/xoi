"use strict"

import iohook from "iohook"
import robot from "robotjs"

import ow from "ow"

import Emittery from "emittery"
import is from "@sindresorhus/is"
import keycode from "keycode"

export type MouseButton = "left" | "right" | "middle"

class Mouse extends Emittery.Typed<{
	down: { button: number, clicks: number, x: number, y: number }
	move: { button: number, clicks: number, x: number, y: number }
	click: { button: number, clicks: number, x: number, y: number }
	wheel: { amount: number, clicks: number, direction: number, rotation: number, x: number, y: number }
	drag: { button: number, clicks: number, x: number, y: number }
}> {
	private _delay = 10
	private _propagate = true

	constructor() {
		super()
		iohook.on("mousedown", ({ button, clicks, x, y }) => this.emit("down", { button, clicks, x, y }))
		iohook.on("mousemove", ({ button, clicks, x, y }) => this.emit("move", { button, clicks, x, y }))
		iohook.on("mouseclick", ({ button, clicks, x, y }) => this.emit("click", { button, clicks, x, y }))
		iohook.on("mousewheel", ({ amount, clicks, direction, rotation, x, y }) => this.emit("wheel", { amount, clicks, direction, rotation, x, y }))
		iohook.on("mousedrag", ({ button, clicks, x, y }) => this.emit("drag", { button, clicks, x, y }))
	}

	public get delay(): number {
		return this._delay
	}

	public set delay(value: number) {
		ow(value, ow.number)

		this._delay = value
		robot.setMouseDelay(value)
	}

	public move(x: number, y: number, { smooth = false, relative = false }: {
		smooth?: boolean
		relative?: boolean
	} = {}): void {
		ow(x, ow.number)
		ow(y, ow.number)
		ow(smooth, ow.boolean)
		ow(relative, ow.boolean)

		if (relative) {
			x += this.x
			y += this.y
		}

		if (smooth) {
			robot.moveMouseSmooth(x, y)
		} else {
			robot.moveMouse(x, y)
		}
	}

	public dragTo(x: number, y: number, { relative = false }: {
		relative?: boolean
	} = {}): void {
		ow(x, ow.number)
		ow(y, ow.number)
		ow(relative, ow.boolean)

		if (relative) {
			x += this.x
			y += this.y
		}

		robot.dragMouse(x, y)
	}

	public scrollTo(x: number, y: number, { relative = false }: {
		relative?: boolean
	} = {}): void {
		ow(x, ow.number)
		ow(y, ow.number)
		ow(relative, ow.boolean)

		if (!relative) {
			x -= this.x
			y -= this.y
		}

		robot.scrollMouse(x, y)
	}

	public down(button: MouseButton = "left"): void {
		ow(button, ow.string.oneOf(["left", "middle", "right"]))

		robot.mouseToggle("down", button)
	}

	public up(button: MouseButton = "left"): void {
		ow(button, ow.string.oneOf(["left", "middle", "right"]))

		robot.mouseToggle("up", button)
	}

	public click(button: MouseButton = "left"): void {
		this.up(button)
		this.down(button)
		this.up(button)
	}

	public clickAt(x: number, y: number, button: MouseButton = "left"): void {
		this.move(x, y)
		this.click(button)
	}

	public get x(): number {
		return robot.getMousePos().x
	}

	public get y(): number {
		return robot.getMousePos().y
	}

	get propagate(): boolean {
		return this._propagate
	}

	set propagate(value: boolean) {
		ow(value, ow.boolean)

		this._propagate = value

		if (value) {
			iohook.enableClickPropagation()
		} else {
			iohook.disableClickPropagation()
		}
	}
}

export type Modifier = "alt" | "command" | "control" | "shift"

class Keyboard extends Emittery.Typed<{
	press: { key: string, code: number, shift: boolean, alt: boolean, ctrl: boolean, meta: boolean }
	down: { key: string, code: number, shift: boolean, alt: boolean, ctrl: boolean, meta: boolean }
	up: { key: string, code: number, shift: boolean, alt: boolean, ctrl: boolean, meta: boolean }
}> {
	public shortcut = new Emittery()

	private _delay = 10

	private readonly _keyboardListeners = new Map()

	constructor() {
		super()
		iohook.on("keypress", ({ keychar, rawcode: code, shiftKey: shift, altKey: alt, ctrlKey: ctrl, metaKey: meta }) => this.emit("press", { key: keycode(keychar), code, shift, alt, ctrl, meta }))
		iohook.on("keydown", ({ rawcode: code, shiftKey: shift, altKey: alt, ctrlKey: ctrl, metaKey: meta }) => this.emit("down", { key: keycode(code), code, shift, alt, ctrl, meta }))
		iohook.on("keyup", ({ rawcode: code, shiftKey: shift, altKey: alt, ctrlKey: ctrl, metaKey: meta }) => this.emit("up", { key: keycode(code), code, shift, alt, ctrl, meta }))

		this.shortcut.on(Emittery.listenerAdded, ({ listener, eventName }) => {
			if (!is.string(eventName)) {
				throw new Error("Keyboard combination must be specified.")
			}

			const combination = eventName.split("+").map((cmb: string) => is.integer(Number(cmb)) ? Number(cmb) : keycode(cmb.toLowerCase()))

			this._keyboardListeners.set({ eventName, listener }, iohook.registerShortcut(combination, () => listener()))
		})

		this.shortcut.on(Emittery.listenerRemoved, ({ listener, eventName }) => {
			if (!is.string(eventName)) {
				throw new Error("Keyboard combination must be specified.")
			}

			iohook.unregisterShortcut(this._keyboardListeners.get({ listener, eventName }))
			this._keyboardListeners.delete({ listener, eventName })
		})
	}

	public get delay(): number {
		return this._delay
	}

	public set delay(value) {
		ow(value, ow.number)

		this._delay = value
		robot.setKeyboardDelay(value)
	}

	public press(key: string, modifier?: Modifier | Modifier[]): void {
		ow(key, ow.string)
		ow(modifier, ow.optional.any(ow.string.oneOf(["alt", "command", "control", "shift"]), ow.array.includesAny(["alt", "command", "control", "shift"])))

		robot.keyTap(key, modifier)
	}

	public down(key: string, modifier?: Modifier | Modifier[]): void {
		ow(key, ow.string)
		ow(modifier, ow.optional.any(ow.string.oneOf(["alt", "command", "control", "shift"]), ow.array.includesAny(["alt", "command", "control", "shift"])))

		robot.keyToggle(key, "down", modifier)
	}

	public up(key: string, modifier?: Modifier | Modifier[]): void {
		ow(key, ow.string)
		ow(modifier, ow.optional.any(ow.string.oneOf(["alt", "command", "control", "shift"]), ow.array.includesAny(["alt", "command", "control", "shift"])))

		robot.keyToggle(key, "up", modifier)
	}

	public type(string: string, { interval }: {
		interval?: number
	} = {
		interval: 0
	}): void {
		ow(string, ow.string)
		ow(interval, ow.optional.number.greaterThanOrEqual(0))

		if (is.number(interval)) {
			interval = string.length * interval / 60
		}

		if (interval > 0) {
			robot.typeStringDelayed(string, interval)
		} else {
			robot.typeString(string)
		}
	}
}

class Screen {
	public pixelAt(x: number, y: number): string {
		ow(x, ow.number)
		ow(y, ow.number)

		return robot.getPixelColor(x, y)
	}

	public get width(): number {
		return robot.getScreenSize().width
	}

	public get height(): number {
		return robot.getScreenSize().height
	}

	public capture(x = 0, y = 0, width: number = this.width, height: number = this.height): robot.Bitmap {
		ow(x, ow.number)
		ow(y, ow.number)
		ow(width, ow.number)
		ow(height, ow.number)

		return robot.screen.capture(x, y, width, height)
	}
}

iohook.start()

export const mouse = new Mouse()
export const keyboard = new Keyboard()
export const screen = new Screen()
