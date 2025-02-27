import {display, fig, row, column} from "../_util"

import {Range1d} from "@bokehjs/models"
import {Direction, OutputBackend} from "@bokehjs/core/enums"
import {Color} from "@bokehjs/core/types"
import {hatch_aliases} from "@bokehjs/core/visuals/patterns"
import {entries} from "@bokehjs/core/util/object"
import {zip} from "@bokehjs/core/util/array"
import {HatchPattern} from "@bokehjs/core/property_mixins"
import {np} from "@bokehjs/api/linalg"

describe("Glyph models", () => {
  const x = [1, 2, 3]
  const y = [1, 2, 3]

  const fill_color = ["red", "orange", "green"]
  const hatch_pattern = ["/", ">", "@"]

  it.allowing(1)("should support AnnularWedge", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([300, 300], {x_range: [0, 6], y_range: [0, 4], output_backend, title: output_backend})
      p.annular_wedge({x: [1, 2, 3], y, inner_radius: 0.5, outer_radius: 1, start_angle: 0.4, end_angle: 4.8, fill_color, alpha: 0.6})
      p.annular_wedge({x: [3, 4, 5], y, inner_radius: 0.5, outer_radius: 1, start_angle: 0.4, end_angle: 4.8, fill_color, alpha: 0.6, hatch_pattern})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support Annulus", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([300, 300], {x_range: [0, 6], y_range: [0, 4], output_backend, title: output_backend})
      p.annulus({x: [1, 2, 3], y, inner_radius: 0.5, outer_radius: 1, fill_color, alpha: 0.6})
      p.annulus({x: [3, 4, 5], y, inner_radius: 0.5, outer_radius: 1, fill_color, alpha: 0.6, hatch_pattern})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it.allowing(1)("should support Arc", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.arc({x, y, radius: 0.25, start_angle: 0.4, end_angle: 4.8, color: "green", alpha: 0.6, line_width: 5})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support Bezier", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.bezier({
        x0: [1, 2, 3], y0: [1, 2, 3],
        x1: [4, 5, 6], y1: [4, 5, 6],
        cx0: [1, 2, 3], cy0: [2, 3, 4],
        cx1: [4, 5, 6], cy1: [3, 4, 5],
        line_width: 5,
      })
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support Block", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.block({x, y, width: 1, height: 2, hatch_pattern})
      return p
    }
    await display(row([p("canvas"), p("svg"), p("webgl")]))
  })

  it("should support Circle", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([300, 300], {x_range: [0, 6], y_range: [0, 4], output_backend, title: output_backend})
      p.circle({x: [1, 2, 3], y, radius: [0.5, 1, 1.5], fill_color, alpha: 0.6})
      p.circle({x: [3, 4, 5], y, radius: [0.5, 1, 1.5], fill_color, alpha: 0.6, hatch_pattern})
      return p
    }
    await display(row([p("canvas"), p("svg"), p("webgl")]))
  })

  it("should support Ellipse", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([300, 300], {x_range: [0, 6], y_range: [0, 4], output_backend, title: output_backend})
      p.ellipse({x: [1, 2, 3], y, width: [1, 1.5, 2], height: [1.5, 2, 2.5], fill_color, alpha: 0.6})
      p.ellipse({x: [3, 4, 5], y, width: [1, 1.5, 2], height: [1.5, 2, 2.5], fill_color, alpha: 0.6, hatch_pattern})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support HArea", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.harea({x1: [1, 2, 3], x2: [2, 3, 4], y: [1, 2, 3]})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support HBar", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.hbar({y: 1, height: [1, 2, 3], left: [1, 2, 3], right: [4, 5, 6]})
      return p
    }
    await display(row([p("canvas"), p("svg"), p("webgl")]))
  })

  /*
  it("should support HexTile", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      //p.hex_tile({q, r})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support Image", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      //p.image({image, x, y, dw, dh})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support ImageRGBA", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      //p.image_rgba({image, x, y, dw, dh})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support ImageURL", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      //p.image_url({url, x, y, w, h})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })
  */

  it("should support Line", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.line({x, y})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support MultiLine", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.multi_line({xs: [x], ys: [y]})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support MultiPolygon", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.multi_polygons({xs: [[[x]]], ys: [[[y]]]})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support Patch", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([300, 300], {x_range: [0, 7], y_range: [0, 6], output_backend, title: output_backend})

      function patch(x: number, colors: Color[], hatches: (HatchPattern | null)[]) {
        let y = 0
        for (const [color, hatch] of zip(colors, hatches)) {
          p.patch({
            x: [x + 1.0, x + 2.0, x + 0.5, x + 3.5, x + 2.0],
            y: [y + 0.5, y + 2.5, y + 3.5, y + 3.0, y + 1.0],
            fill_color: color,
            alpha: 0.6,
            hatch_pattern: hatch,
          })
          y++
        }
      }

      patch(0, fill_color, [null, null, null])
      patch(3, fill_color, hatch_pattern)

      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support Patches", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([300, 300], {x_range: [0, 7], y_range: [0, 6], output_backend, title: output_backend})

      function patches(x: number, colors: Color[], hatches?: HatchPattern[]) {
        const xs = [], ys = []
        for (let y = 0; y < 3; y++) {
          xs.push([x + 1.0, x + 2.0, x + 0.5, x + 3.5, x + 2.0])
          ys.push([y + 0.5, y + 2.5, y + 3.5, y + 3.0, y + 1.0])
        }

        p.patches({xs, ys, fill_color: colors, alpha: 0.6, hatch_pattern: hatches})
      }

      patches(0, fill_color)
      patches(3, fill_color, hatch_pattern)

      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support Quad", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.quad({left: x, right: 1, bottom: y, top: 1})
      return p
    }
    await display(row([p("canvas"), p("svg"), p("webgl")]))
  })

  it("should support Quadratic", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.quadratic({x0: [1, 2, 3], y0: [1, 2, 3], x1: [4, 5, 6], y1: [4, 5, 6], cx: 1, cy: 1})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support Ray", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.ray({x, y})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support Rect", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.rect({x, y, width: 1, height: 2, angle: [0, 90, -15], angle_units: "deg", alpha: 0.7})
      return p
    }
    await display(row([p("canvas"), p("svg"), p("webgl")]))
  })

  it("should support Segment", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.segment({x0: [1, 2, 3], y0: [1, 2, 3], x1: [4, 5, 6], y1: [4, 5, 6]})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support Step", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.step({x, y: [1.2, 2.2, 3.2], line_width: 5, line_cap: "round", mode: "before", line_color: "red"})
      p.step({x, y: [1.1, 2.1, 3.1], line_width: 5, line_cap: "round", mode: "center", line_color: "green"})
      p.step({x, y: [1.0, 2.0, 3.0], line_width: 5, line_cap: "round", mode: "after", line_color: "blue"})
      return p
    }
    await display(row([p("canvas"), p("svg"), p("webgl")]))
  })

  it("should support Step with NaN", async () => {
    const x0 = [0, 1, 2, 3, 4]

    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.step({x: x0, y: [0.2, 1.2, NaN, 1.0, 0.0], line_width: 5, line_cap: "round", mode: "before", line_color: "red"})
      p.step({x: x0, y: [0.1, 1.1, NaN, 1.1, 0.1], line_width: 5, line_cap: "round", mode: "center", line_color: "green"})
      p.step({x: x0, y: [0.0, 1.0, NaN, 1.2, 0.2], line_width: 5, line_cap: "round", mode: "after", line_color: "blue"})
      return p
    }
    await display(row([p("canvas"), p("svg"), p("webgl")]))
  })

  it("should support Text", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.text({x, y, text: "Some"})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support VArea", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.varea({x, y1: [1, 2, 3], y2: [4, 5, 6]})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support VBar", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([200, 300], {output_backend, title: output_backend})
      p.vbar({x, width: [1, 2, 3], bottom: [1, 2, 3], top: [4, 5, 6]})
      return p
    }
    await display(row([p("canvas"), p("svg"), p("webgl")]))
  })

  it("should support Wedge", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([300, 300], {x_range: [0, 6], y_range: [0, 4], output_backend, title: output_backend})
      p.wedge({x: [1, 2, 3], y, radius: [1, 1.25, 1.5], start_angle: 0.4, end_angle: 4.8, fill_color, alpha: 0.6})
      p.wedge({x: [3, 4, 5], y, radius: [1, 1.25, 1.5], start_angle: 0.4, end_angle: 4.8, fill_color, alpha: 0.6, hatch_pattern})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support full circle Wedge", async () => {
    const x = [0, 1, 0, 1]
    const y = [0, 0, 1, 1]
    const y2 = [2, 2, 3, 3]

    const small = 1e-7
    let start_angle = [0, 0, 0, 0]
    let end_angle = [2*np.pi, 2*np.pi+small, -2*np.pi, -2*np.pi-small]

    // Round angles to float32 (issue #11475).
    start_angle = start_angle.map(x => Math.fround(x))
    end_angle = end_angle.map(x => Math.fround(x))

    function p(output_backend: OutputBackend) {
      const p = fig([150, 300], {x_range: [-0.5, 1.5], y_range: [-0.5, 3.5], output_backend, title: output_backend})
      p.wedge({x, y, start_angle, end_angle, radius: 0.4, direction: "clock", alpha: 0.6, line_color: "red", line_width: 2})
      p.wedge({x, y: y2, start_angle, end_angle, radius: 0.4, direction: "anticlock", alpha: 0.6, line_color: "blue", line_width: 2})
      return p
    }
    await display(row([p("canvas"), p("svg")]))
  })

  it("should support fill with hatch patterns", async () => {
    function p(output_backend: OutputBackend) {
      const p = fig([400, 800], {output_backend, title: output_backend})
      let y = 0
      for (const [alias, name] of entries(hatch_aliases)) {
        p.quad({left: 0, bottom: y, right: 1.95, top: y + 0.75, hatch_pattern: alias, hatch_scale: 12})
        p.quad({left: 2.05, bottom: y, right: 4, top: y + 0.75, hatch_pattern: name, hatch_scale: 12})
        y++
      }
      return p
    }
    await display(row([p("canvas"), p("svg"), p("webgl")]))
  })

  it("should support rotation with all angle units", async () => {
    function p(sign: -1 | 1, output_backend: OutputBackend) {
      const x_range = new Range1d({start: -1, end: 7})
      const y_range = new Range1d({start: -1, end: 1})

      const p = fig([400, 150], {output_backend, title: output_backend, x_range, y_range})

      const y = 0
      const inner_radius = 0.5
      const outer_radius = 1
      const alpha = 0.6

      function f(direction: Direction, color: Color) {
        p.annular_wedge({
          x: 0, y, inner_radius, outer_radius, fill_color: color, line_color: null, alpha,
          start_angle: {value: sign*Math.PI/2, units: "rad"},
          end_angle: {value: sign*Math.PI/4, units: "rad"},
          direction,
        })
        p.annular_wedge({
          x: 2, y,
          inner_radius, outer_radius, fill_color: color, line_color: null, alpha,
          start_angle: {value: sign*90, units: "deg"},
          end_angle: {value: sign*45, units: "deg"},
          direction,
        })
        p.annular_wedge({
          x: 4, y,
          inner_radius, outer_radius, fill_color: color, line_color: null, alpha,
          start_angle: {value: sign*100, units: "grad"},
          end_angle: {value: sign*50, units: "grad"},
          direction,
        })
        p.annular_wedge({
          x: 6, y,
          inner_radius, outer_radius, fill_color: color, line_color: null, alpha,
          start_angle: {value: sign*0.25, units: "turn"},
          end_angle: {value: sign*0.125, units: "turn"},
          direction,
        })
      }

      f("anticlock", "green")
      f("clock", "blue")

      return p
    }

    const r0 = row([p(+1, "canvas"), p(+1, "svg")])
    const r1 = row([p(-1, "canvas"), p(-1, "svg")])

    await display(column([r0, r1]))
  })
})
