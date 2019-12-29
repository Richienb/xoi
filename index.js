"use strict"

const iohook = require("iohook")
const robot = require("robotjs")

const { default: is } = require("@sindresorhus/is")
const { default: ow } = require("ow")

const kc = require("keycode")
const EventEmitter = require("events")
const hexRgb = require("hex-rgb")
const filterObj = require("filter-obj")

const coords = ["x", "y"]

const mouseDelay = 10

const mouse = new class extends EventEmitter {
    get delay() {
        return mouseDelay
    }
    set delay(value) {
        ow(value, ow.number)
        mouseDelay = value
        robot.setMouseDelay(value)
    }

    move(x, y, { smooth = false, relative = false } = {}) {
        ow(x, ow.number)
        ow(y, ow.number)
        ow(smooth, ow.boolean)
        ow(relative, ow.relative)

        if (relative) {
            x += mouse.x
            y += mouse.y
        }

        if (smooth) robot.moveMouseSmooth(x, y)
        else robot.moveMouse(x, y)
    }

    dragTo(x, y, { relative = false } = {}) {
        ow(x, ow.number)
        ow(y, ow.number)
        ow(relative, ow.boolean)

        if (relative) {
            x += mouse.x
            y += mouse.y
        }

        robot.dragMouse(x, y)
    }

    scrollTo(x, y, { relative = false } = {}) {
        ow(x, ow.number)
        ow(y, ow.number)
        ow(relative, ow.boolean)

        if (!relative) {
            x -= mouse.x
            y -= mouse.y
        }

        robot.scrollMouse(x, y)
    }

    down(button = "left") {
        ow(button, ow.string.is((val) => ["left", "right", "middle"].includes(val)))
        robot.mouseToggle("down", button)
    }

    up(button = "left") {
        ow(button, ow.string.is((val) => ["left", "right", "middle"].includes(val)))
        robot.mouseToggle("up", button)
    }

    click(button) {
        mouse.up(button)
        mouse.down(button)
        mouse.up(button)
    }

    clickAt(x, y, button) {
        mouse.move(x, y)
        mouse.click(button)
    }

    get x() {
        return robot.getMousePos().x
    }

    get y() {
        return robot.getMousePos().y
    }
}

const baseMouse = ["button", "clicks", ...coords]

iohook.on("mousedown", (data) => mouse.emit("down", filterObj(data, baseMouse)))
iohook.on("mousemove", (data) => mouse.emit("move", filterObj(data, baseMouse)))
iohook.on("mouseclick", (data) => mouse.emit("click", filterObj(data, baseMouse)))
iohook.on("mousewheel", (data) => mouse.emit("wheel", filterObj(data, ["amount", "clicks", "direction", "rotation", ...coords])
))
iohook.on("mousedrag", (data) => mouse.emit("wheel", filterObj(data, baseMouse)))

const keyboardDelay = 10

const keyboard = new class extends EventEmitter {
    shortcut = new EventEmitter()

    get delay() {
        return keyboardDelay
    }

    set delay(value) {
        ow(value, ow.number)
        keyboardDelay = value
        robot.setKeyboardDelay(value)
    }

    press(key, modifier) {
        ow(key, ow.string)
        ow(modifier, ow.any(ow.undefined, ow.string.is(val => ["alt", "command", "control", "shift"].includes(val))))

        robot.keyTap(key, modifier)
    }

    down(key, modifier) {
        ow(key, ow.string)
        ow(modifier, ow.any(ow.undefined, ow.string.is(val => ["alt", "command", "control", "shift"].includes(val))))

        robot.keyToggle(key, "down", modifier)
    }

    up(key, modifier) {
        ow(key, ow.string)
        ow(modifier, ow.any(ow.undefined, ow.string.is(val => ["alt", "command", "control", "shift"].includes(val))))

        robot.keyToggle(key, "up", modifier)
    }

    type(string, { interval } = {}) {
        ow(string, ow.string)
        ow(interval, ow.any(ow.undefined, ow.number))

        if (is.number(interval)) {
            interval = string.length * interval / 60
        }

        if (interval) robot.typeStringDelayed(string, interval)
        else robot.typeString(string)
    }
}

iohook.on("keypress", ({ keycode }) => keyboard.emit("press", { key: kc(keycode), code: keycode }))
iohook.on("keydown", ({ keycode }) => keyboard.emit("down", { key: kc(keycode), code: keycode }))
iohook.on("keyup", ({ keycode }) => keyboard.emit("up", { key: kc(keycode), code: keycode }))

keyboard.shortcut.on("newListener", (combination, callback) => {
    if (is.array(combination)) iohook.registerShortcut(combination.map(cmb => is.number(cmb) ? cmb : kc.codes[cmb]), callback)
})

keyboard.shortcut.on("removeListener", (combination, callback) => {
    if (is.array(combination)) iohook.unregisterShortcut(combination.map(cmb => is.number(cmb) ? cmb : kc.codes[cmb]), callback)
})

iohook.start()

function betterHex(hex) {
    const { red, green, blue } = hexRgb(hex)
    return {
        red,
        green,
        blue,
        rgb: `rgb(${red}, ${green}, ${blue})`,
        hex: `#${hex}`
    }
}

const screen = {
    pixelAt(x, y) {
        ow(x, ow.number)
        ow(y, ow.number)

        return betterHex(robot.getPixelColor(x, y))
    },

    get width() {
        return robot.getScreenSize().width
    },

    get height() {
        return robot.getScreenSize().height
    },

    capture(x = 0, y = 0, width = screen.width, height = screen.height) {
        ow(x, ow.number)
        ow(y, ow.number)
        ow(width, ow.number)
        ow(height, ow.number)

        return robot.screen.capture(x, y, width, height)
    }
}

module.exports = {
    mouse,
    keyboard,
    screen,
}
