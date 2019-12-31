# Xoi [![Travis CI Build Status](https://img.shields.io/travis/com/Richienb/xoi/master.svg?style=for-the-badge)](https://travis-ci.com/Richienb/xoi)

Control and detect the mouse, keyboard and screen.

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
mouse.click("right")

// When mouse clicked
mouse.on("click", ({ button }) =>
    console.log(`The ${button} mouse button was clicked.`)
);

// Type text
keyboard.type("Hello World!");

// When key pressed
keyboard.on("press", ({ key }) => console.log(`${key} was pressed.`));

// Get hex code of pixel at x=100 y=100
const { hex } = screen.pixelAt(100, 100);
console.log(`The colour ${hex} is at x=100, y=100`)
```

## API

For more information, see the [documentation](https://richienb.github.io/xoi).

### mouse

See the [documentation](https://richienb.github.io/xoi/globals.html#mouse)

#### `mouse.on` events

-   `down`
-   `move`
-   `click`
-   `wheel`

### keyboard

See the [documentation](https://richienb.github.io/xoi/globals.html#keyboard)

#### `keyboard.on` events

-   `press`
-   `down`
-   `up`

### screen

See the [documentation](https://richienb.github.io/xoi/globals.html#screen)
