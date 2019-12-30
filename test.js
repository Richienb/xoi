import test from "ava"
import xoi from "."

test("main", (t) => {
    t.throws(() => {
        xoi(123)
    }, {
        instanceOf: TypeError,
        message: "Expected a string, got number",
    })

    t.is(xoi("unicorns"), "unicorns & rainbows")
})
