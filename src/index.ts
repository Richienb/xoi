"use strict"

import iohook from "iohook"
import robot from "robotjs"

import ow from "ow"

import kc from "keycode"
import EventEmitter from "events"
import hexRgb from "hex-rgb"
import _ from "lodash"

const coords = ["x", "y"]

declare type mouseType = "left" | "right" | "middle"

class Mouse extends EventEmitter {
    private delay_ = 10

    public get delay(): number {
        return this.delay_
    }
    public set delay(value: number) {
        ow(value, ow.number)
        this.delay_ = value
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

    public down(button: mouseType = "left"): void {
        ow(button, ow.string.is((val) => ["left", "right", "middle"].includes(val)))
        robot.mouseToggle("down", button)
    }

    public up(button: mouseType = "left"): void {
        ow(button, ow.string.is((val) => ["left", "right", "middle"].includes(val)))
        robot.mouseToggle("up", button)
    }

    public click(button: mouseType = "left") {
        this.up(button)
        this.down(button)
        this.up(button)
    }

    public clickAt(x: number, y: number, button: mouseType = "left") {
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

const mouse = new Mouse()

const baseMouse = ["button", "clicks", ...coords]

iohook.on("mousedown", (data) => mouse.emit("down", _.pick(data, baseMouse)))
iohook.on("mousemove", (data) => mouse.emit("move", _.pick(data, baseMouse)))
iohook.on("mouseclick", (data) => mouse.emit("click", _.pick(data, baseMouse)))
iohook.on("mousewheel", (data) => mouse.emit("wheel", _.pick(data, ["amount", "clicks", "direction", "rotation", ...coords])
))
iohook.on("mousedrag", (data) => mouse.emit("wheel", _.pick(data, baseMouse)))

declare type modifier = "alt" | "command" | "control" | "shift"

class Keyboard extends EventEmitter {
    public shortcut = new EventEmitter()

    private delay_ = 10

    public get delay(): number {
        return this.delay_
    }

    public set delay(value) {
        ow(value, ow.number)
        this.delay_ = value
        robot.setKeyboardDelay(value)
    }

    public press(key: string, modifier: modifier | modifier[]): void {
        ow(key, ow.string)
        ow(modifier, ow.any(ow.undefined, ow.string.is(val => ["alt", "command", "control", "shift"].includes(val)), ow.array))

        robot.keyTap(key, modifier)
    }

    public down(key: string, modifier: modifier | modifier[]): void {
        ow(key, ow.string)
        ow(modifier, ow.any(ow.undefined, ow.string.is(val => ["alt", "command", "control", "shift"].includes(val)), ow.array))

        robot.keyToggle(key, "down", modifier)
    }

    public up(key: string, modifier: modifier | modifier[]): void {
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

const keyboard = new Keyboard()

iohook.on("keypress", ({ keycode }) => keyboard.emit("press", { key: kc(keycode), code: keycode }))
iohook.on("keydown", ({ keycode }) => keyboard.emit("down", { key: kc(keycode), code: keycode }))
iohook.on("keyup", ({ keycode }) => keyboard.emit("up", { key: kc(keycode), code: keycode }))

const keyboardListeners = {}

keyboard.shortcut.on("newListener", (combination: any, callback: Function) => {
    if (_.isArray(combination)) keyboardListeners[iohook.registerShortcut(combination.map(cmb => _.isNumber(cmb) ? cmb : kc.codes[cmb]), callback)] = { combination, callback }
})

keyboard.shortcut.on("removeListener", (combination: any, callback: Function) => {
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

iohook.start(false)

declare interface HexData {
    red: number
    green: number
    blue: number
    rgb: string
    hex: string
}

class Screen {
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

const screen = new Screen()

export = {
    mouse,
    keyboard,
    screen,
}
