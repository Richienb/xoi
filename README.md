# Xoi [![Travis CI Build Status](https://img.shields.io/travis/com/Richienb/xoi/master.svg?style=for-the-badge)](https://travis-ci.com/Richienb/xoi)

Detect and control the mouse, keyboard and screen.

[![NPM Badge](https://nodei.co/npm/xoi.png)](https://npmjs.com/package/xoi)

## Install

```sh
npm install xoi
```

## Usage

```js
const { mouse, keyboard, screen } = require("xoi");

// Realistically move the mouse to x=100 y=100
mouse.move(100, 100, { smooth: true });

// Right-click
mouse.click("right");

// When mouse clicked
mouse.on("click", ({ button }) => {
	console.log(`The ${button} mouse button was clicked.`);
});

// Type text
keyboard.type("Hello World!");

// When key pressed
keyboard.on("press", ({ key }) => {
	console.log(`${key} was pressed.`);
});

// Get hex code of pixel at x=100 y=100
const hex = screen.pixelAt(100, 100);
console.log(`The colour #${hex} is at x=100, y=100`);
```

## API

### mouse.x

Type: `number`

The x coordinate of the mouse.

### mouse.y

Type: `number`

The y coordinate of the mouse.

### mouse.delay

Type: `number`
Default: `10`

The amount of time to wait in milliseconds after a mouse press before executing another.

### mouse.move(x, y, options?)

Move the mouse to a specific location.

### mouse.dragTo(x, y, options?)

Drag the mouse from it's current location to the specified location.

### mouse.scrollTo(x, y, options?)

Scroll the mouse to the specified location.

#### x

Type: `number`

The x coordinate of the target location.

#### y

Type: `number`

The y coordinate of the target location.

#### options

Type: `object`

##### relative

Type: `boolean`\
Default: `true`

Treat `x` and `y` as relative values from the current location.

##### smooth

**Only available for mouse.move**

Type: `boolean`\
Default: `false`

Smoothly move the mouse.

### mouse.click(button?)

Press and release a mouse button.

### mouse.clickAt(x, y, button?)

Click at a specific location.

### mouse.down(button?)

Press down a mouse button.

### mouse.up(button?)

Release a mouse button that is pressed down.

#### button

Default: `left`

The mouse button to press. Can be `left`, `right` or `middle`

#### x

The x coordinate of the target location.

#### y

The y coordinate of the target location.

### Mouse events

You can listen for mouse events with `mouse.on`.

```js
const { mouse } = require("xoi");

mouse.on("click", ({ button }) => {
	console.log(`You clicked with the ${button} mouse button!`);
});
```

#### Event data for `down`, `move`, `click` and `drag`

##### button

Type: `number`

The number associated with the mouse button that was clicked.

##### clicks

Type: `number`

The amount of times in a row this mouse action has been performed. The counter resets when another action is done.

##### x

Type: `number`

The x coordinate of the mouse location.

##### y

Type: `number`

The y coordinate of the mouse location.

#### Event data for `wheel`

##### amount

Type: `number`

The distance scrolled.

##### rotation

Type: `number`

The scrolling direction. Can be `1` or `-1`.

##### x

Type: `number`

The x coordinate of the mouse location.

##### y

Type: `number`

The y coordinate of the mouse location.

### keyboard

### keyboard.delay

Type: `number`
Default: `10`

The amount of time in milliseconds to wait after pressing a key before pressing another.

### keyboard.type(input, options?)

Type some text.

#### input

Type: `string`

The text to type.

#### options

Type: `object`

##### interval

The interval in milliseconds to wait between presses.

### keyboard.press(key, modifier?)

Press a key.

### keyboard.down(key, modifier?)

Hold down a key.

### keyboard.up(key, modifier?)

Release a key that is held down.

#### key

Type: `string`

The key to press.

#### modifier

Type: `string or array`

The key modifiers to use. Can be `alt`, `command`, `control` or `shift` either as a string or in an array.

### Keyboard events

You can listen for keyboard events with `keyboard.on`.

```js
const { keyboard } = require("xoi");

keyboard.on("press", ({ key }) => {
	console.log(`You pressed the ${key} key!`);
});
```

#### Event data for `press`, `down` and `up`

##### key

Type: `string`

The key that was pressed.

##### code

Type: `number`

The ID of the key that was pressed.

##### shift

Type: `boolean`

Whether the <kbd>shift</kbd> button was held down.

##### alt

Type: `boolean`

Whether the <kbd>alt</kbd> button was held down.

##### ctrl

Type: `boolean`

Whether the <kbd>ctrl</kbd> button was held down.

##### meta

Type: `boolean`

Whether the <kbd>meta</kbd> button was held down.

#### Listening for keyboard shortcuts

`keyboard.shortcut` exposes an event listener that emits when keyboard shortcuts are executed.

```js
const { keyboard } = require("xoi");

keyboard.shortcut.on("ctrl+a", () => {
	console.log("ctrl+a pressed!")
})
```

### screen

### screen.width

Type: `number`

The screen width.

### screen.height

Type: `number`

The screen height.

### screen.pixelAt(x, y)

Get the hex code for the pixel colour at a specific coordinate.

#### x

Type: `number`

The x coordinate of the pixel location.

#### y

Type: `number`

The y coordinate of the pixel location.

### screen.capture(x, y, width, height)

#### x

Type: `number`\
Default: `0`

The coordinates on the screen for the top-left corner of the screenshot.

#### y

Type: `number`\
Default: `0`

The height of the screenshot.

#### width

Type: `number`\
Default: screen width

The width of the screenshot.

#### height

Type: `number`\
Default: screen height

The height of the screenshot.

## FAQ

### What are the prerequisites to use xoi?

See https://github.com/octalmage/robotjs#building and https://github.com/wilix-team/iohook/blob/master/docs/os-support.md.
