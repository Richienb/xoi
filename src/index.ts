"use strict"

import iohook from "iohook"
import robot from "robotjs"

import ow from "ow"

import kc from "keycode"
import EventEmitter from "events"
import hexRgb from "hex-rgb"
import _ from "lodash"

namespace Mouse {
    type MouseButton = "left" | "right" | "middle"

    const coords = ["x", "y"]

    const baseMouse = ["button", "clicks", ...coords]

    export class Mouse extends EventEmitter {
        private _delay = 10

        constructor() {
            super()
            iohook.on("mousedown", (data) => this.emit("down", _.pick(data, baseMouse)))
            iohook.on("mousemove", (data) => this.emit("move", _.pick(data, baseMouse)))
            iohook.on("mouseclick", (data) => this.emit("click", _.pick(data, baseMouse)))
            iohook.on("mousewheel", (data) => this.emit("wheel", _.pick(data, ["amount", "clicks", "direction", "rotation", ...coords])
            ))
            iohook.on("mousedrag", (data) => this.emit("wheel", _.pick(data, baseMouse)))
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

            if (smooth) robot.moveMouseSmooth(x, y)
            else robot.moveMouse(x, y)
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
            ow(button, ow.string.is((val) => ["left", "right", "middle"].includes(val)))
            robot.mouseToggle("down", button)
        }

        public up(button: MouseButton = "left"): void {
            ow(button, ow.string.is((val) => ["left", "right", "middle"].includes(val)))
            robot.mouseToggle("up", button)
        }

        public click(button: MouseButton = "left") {
            this.up(button)
            this.down(button)
            this.up(button)
        }

        public clickAt(x: number, y: number, button: MouseButton = "left") {
            this.move(x, y)
            this.click(button)
        }

        public get x(): number {
            return robot.getMousePos().x
        }

        public get y(): number {
            return robot.getMousePos().y
        }
    }
}

namespace Keyboard {
    type Modifier = "alt" | "command" | "control" | "shift"

    export class Keyboard extends EventEmitter {
        public shortcut = new EventEmitter()

        private _delay = 10

        constructor() {
            super()
            iohook.on("keypress", ({ keycode }) => this.emit("press", { key: kc(keycode), code: keycode }))
            iohook.on("keydown", ({ keycode }) => this.emit("down", { key: kc(keycode), code: keycode }))
            iohook.on("keyup", ({ keycode }) => this.emit("up", { key: kc(keycode), code: keycode }))

            const keyboardListeners = {}

            this.shortcut.on("newListener", (combination: any, callback: Function) => {
                if (_.isArray(combination)) keyboardListeners[iohook.registerShortcut(combination.map(cmb => _.isNumber(cmb) ? cmb : kc.codes[cmb]), callback)] = { combination, callback }
            })

            this.shortcut.on("removeListener", (combination: any, callback: Function) => {
                if (_.isArray(combination)) _.forOwn(keyboardListeners, ({ combination: cmb, callback: cb }: { combination: any, callback: Function }, key: string) => {
                    if (
                        cmb === combination &&
                        cb === callback
                    ) {
                        iohook.unregisterShortcut(Number(key))
                        return false
                    }
                })
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

        public press(key: string, modifier: Modifier | Modifier[]): void {
            ow(key, ow.string)
            ow(modifier, ow.any(ow.undefined, ow.string.is(val => ["alt", "command", "control", "shift"].includes(val)), ow.array))

            robot.keyTap(key, modifier)
        }

        public down(key: string, modifier: Modifier | Modifier[]): void {
            ow(key, ow.string)
            ow(modifier, ow.any(ow.undefined, ow.string.is(val => ["alt", "command", "control", "shift"].includes(val)), ow.array))

            robot.keyToggle(key, "down", modifier)
        }

        public up(key: string, modifier: Modifier | Modifier[]): void {
            ow(key, ow.string)
            ow(modifier, ow.any(ow.undefined, ow.string.is(val => ["alt", "command", "control", "shift"].includes(val)), ow.array))

            robot.keyToggle(key, "up", modifier)
        }

        public type(string: string, { interval }: {
            interval?: number
        }): void {
            ow(string, ow.string)
            ow(interval, ow.any(ow.undefined, ow.number))

            if (_.isNumber(interval)) {
                interval = string.length * interval / 60
            }

            if (interval) robot.typeStringDelayed(string, interval)
            else robot.typeString(string)
        }
    }
}

namespace Screen {
    interface HexData {
        red: number
        green: number
        blue: number
        rgb: string
        hex: string
    }

    export class Screen {
        private betterHex(hex: string): HexData {
            const { red, green, blue } = hexRgb(hex)
            return {
                red,
                green,
                blue,
                rgb: `rgb(${red}, ${green}, ${blue})`,
                hex: `#${hex}`
            }
        }

        public pixelAt(x: number, y: number): HexData {
            ow(x, ow.number)
            ow(y, ow.number)

            return this.betterHex(robot.getPixelColor(x, y))
        }

        public get width(): number {
            return robot.getScreenSize().width
        }

        public get height(): number {
            return robot.getScreenSize().height
        }

        public capture(x = 0, y = 0, width: number = screen.width, height: number = screen.height): robot.Bitmap {
            ow(x, ow.number)
            ow(y, ow.number)
            ow(width, ow.number)
            ow(height, ow.number)

            return robot.screen.capture(x, y, width, height)
        }
    }
}

iohook.start(false)

export const mouse = new Mouse.Mouse()
export const keyboard = new Keyboard.Keyboard()
export const screen = new Screen.Screen()
