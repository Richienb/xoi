"use strict"

import iohook from "iohook"
import robot from "robotjs"

import ow from "ow"

import Emittery from "emittery"
import is from "@sindresorhus/is"
import keycode from "keycode"

// TODO: Move types to namespace in next major release.
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
		// TODO: Format `rotation` as "up" or "down" in next major release and maybe remove `direction` and `clicks`.
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

	/**
	Move the mouse to a specific location.

	@param x The x coordinate of the target location.
	@param y The y coordinate of the target location.
	@param smooth Smoothly move the mouse.
	@param relative Treat `x` and `y` as relative values from the current location.
	*/
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

	/**
	Drag the mouse from it's current location to the specified location.

	@param x The x coordinate of the target location.
	@param y The y coordinate of the target location.
	@param relative Treat `x` and `y` as relative values from the current location.
	*/
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

	/**
	Scroll the mouse to the specified location.

	@param x The x coordinate of the target location.
	@param y The y coordinate of the target location.
	@param relative Treat `x` and `y` as relative values from the current location.
	*/
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

	/**
	Press down a mouse button.

	@param button The mouse button to press.
	*/
	public down(button: MouseButton = "left"): void {
		ow(button, ow.string.oneOf(["left", "middle", "right"]))

		robot.mouseToggle("down", button)
	}

	/**
	Release a mouse button that is pressed down.

	@param button The mouse button to press.
	*/
	public up(button: MouseButton = "left"): void {
		ow(button, ow.string.oneOf(["left", "middle", "right"]))

		robot.mouseToggle("up", button)
	}

	/**
	Press and release a mouse button.

	@param button The mouse button to press.
	*/
	public click(button: MouseButton = "left"): void {
		this.up(button)
		this.down(button)
		this.up(button)
	}

	/**
	Click at a specific location.

	@param x The x coordinate of the target location.
	@param y The y coordinate of the target location.
	@param button The mouse button to press.
	*/
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

// TODO: Make `command` match `meta` in keyboard events.
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

	/**
	Press a key.

	@param key The key to press.
	@param modifier The key modifiers to use.
	*/
	public press(key: string, modifier: Modifier | Modifier[] = []): void {
		ow(key, ow.string)
		ow(modifier, ow.optional.any(ow.string.oneOf(["alt", "command", "control", "shift"]), ow.array.includesAny(["alt", "command", "control", "shift"])))

		robot.keyTap(key, modifier)
	}

	/**
	Hold down a key.

	@param key The key to hold down.
	@param modifier The key modifiers to use.
	*/
	public down(key: string, modifier?: Modifier | Modifier[]): void {
		ow(key, ow.string)
		ow(modifier, ow.optional.any(ow.string.oneOf(["alt", "command", "control", "shift"]), ow.array.includesAny(["alt", "command", "control", "shift"])))

		robot.keyToggle(key, "down", modifier)
	}

	/**
	Release a key that is held down.

	@param key The key that is held down.
	@param modifier The key modifiers to use.
	*/
	public up(key: string, modifier?: Modifier | Modifier[]): void {
		ow(key, ow.string)
		ow(modifier, ow.optional.any(ow.string.oneOf(["alt", "command", "control", "shift"]), ow.array.includesAny(["alt", "command", "control", "shift"])))

		robot.keyToggle(key, "up", modifier)
	}

	/**
	Type some text.

	@param input The text to type.
	@param interval The interval in milliseconds to wait between presses.
	*/
	public type(input: string, { interval = 0 }: {
		interval?: number
	} = {}): void {
		ow(input, ow.string)
		ow(interval, ow.optional.number.greaterThanOrEqual(0))

		if (is.number(interval)) {
			interval = input.length * interval / 60
		}

		if (interval > 0) {
			robot.typeStringDelayed(input, interval)
		} else {
			robot.typeString(input)
		}
	}
}

class Screen {
	public get width(): number {
		return robot.getScreenSize().width
	}

	public get height(): number {
		return robot.getScreenSize().height
	}

	/**
	Get the hex code for the pixel colour at a specific coordinate.

	@param x The x coordinate of the pixel location.
	@param y The y coordinate of the pixel location.
	*/
	public pixelAt(x: number, y: number): string {
		ow(x, ow.number)
		ow(y, ow.number)

		return robot.getPixelColor(x, y)
	}

	/**
	Take a screenshot of the current screen.

	@param x The coordinates on the screen for the top-left corner of the screenshot.
	@param y The height of the screenshot.
	@param width The width of the screenshot.
	@param height The height of the screenshot.
	*/
	public capture(x = 0, y = 0, width: number = this.width, height: number = this.height): robot.Bitmap {
		ow(x, ow.number)
		ow(y, ow.number)
		ow(width, ow.number)
		ow(height, ow.number)

		// TODO: Revamp bitmap API in next major version.
		return robot.screen.capture(x, y, width, height)
	}
}

iohook.start()

export const mouse = new Mouse()
export const keyboard = new Keyboard()
export const screen = new Screen()
