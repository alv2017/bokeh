import {UIElement, UIElementView} from "../ui/ui_element"
import {Menu} from "../menus/menu"
import {IterViews} from "core/view"
import {Signal} from "core/signaling"
import {Color} from "core/types"
import {Align, SizingMode} from "core/enums"
import {position, classes, extents, undisplayed, StyleSheetLike} from "core/dom"
import {logger} from "core/logging"
import {isNumber, isArray} from "core/util/types"
import {color2css} from "core/util/color"
import {assign} from "core/util/object"
import {parse_css_font_size} from "core/util/text"
import * as p from "core/properties"

import {build_views} from "core/build_views"
import {DOMComponentView} from "core/dom_view"
import {SizingPolicy, BoxSizing, Size, Layoutable} from "core/layout"
import {CanvasLayer} from "core/util/canvas"
import {SerializableState} from "core/view"

export abstract class LayoutDOMView extends UIElementView {
  override model: LayoutDOM

  override root: LayoutDOMView
  override readonly parent: DOMComponentView

  override el: HTMLElement

  protected _child_views: Map<LayoutDOM, LayoutDOMView>

  protected _on_resize?: () => void

  protected _offset_parent: Element | null = null

  protected _parent_observer?: number

  protected _viewport: Partial<Size> = {}

  layout: Layoutable

  readonly mouseenter = new Signal<MouseEvent, this>(this, "mouseenter")
  readonly mouseleave = new Signal<MouseEvent, this>(this, "mouseleave")

  get is_layout_root(): boolean {
    return this.is_root || !(this.parent instanceof LayoutDOMView)
  }

  get base_font_size(): number | null {
    const font_size = getComputedStyle(this.el).fontSize
    const result = parse_css_font_size(font_size)

    if (result != null) {
      const {value, unit} = result
      if (unit == "px")
        return value
    }

    return null
  }

  override initialize(): void {
    super.initialize()
    this.el.style.position = this.is_layout_root ? "relative" : "absolute"
    this._child_views = new Map()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await this.build_child_views()
  }

  override remove(): void {
    for (const child_view of this.child_views)
      child_view.remove()
    this._child_views.clear()
    super.remove()
  }

  override connect_signals(): void {
    super.connect_signals()

    this.el.addEventListener("mouseenter", (event) => {
      this.mouseenter.emit(event)
    })
    this.el.addEventListener("mouseleave", (event) => {
      this.mouseleave.emit(event)
    })
    this.el.addEventListener("contextmenu", (event) => {
      if (this.model.context_menu != null) {
        console.log("context menu")
        event.preventDefault()
      }
    })

    if (this.is_layout_root) {
      this._on_resize = () => this.resize_layout()
      window.addEventListener("resize", this._on_resize)

      this._parent_observer = setInterval(() => {
        const offset_parent = this.el.offsetParent

        if (this._offset_parent != offset_parent) {
          this._offset_parent = offset_parent

          if (offset_parent != null) {
            this.compute_viewport()
            this.invalidate_layout()
          }
        }
      }, 250)
    }

    const p = this.model.properties
    this.on_change([
      p.width, p.height,
      p.min_width, p.min_height,
      p.max_width, p.max_height,
      p.margin,
      p.width_policy, p.height_policy, p.sizing_mode,
      p.aspect_ratio,
      p.visible,
    ], () => this.invalidate_layout())

    this.on_change([
      p.background,
      p.css_classes,
      p.style,
      p.stylesheets,
    ], () => this.invalidate_render())
  }

  override disconnect_signals(): void {
    if (this._parent_observer != null)
      clearTimeout(this._parent_observer)
    if (this._on_resize != null)
      window.removeEventListener("resize", this._on_resize)
    super.disconnect_signals()
  }

  override css_classes(): string[] {
    return [...super.css_classes(), ...this.model.css_classes]
  }

  override styles(): StyleSheetLike[] {
    return [...super.styles(), ...this.model.stylesheets]
  }

  override *children(): IterViews {
    yield* super.children()
    yield* this.child_views
  }

  abstract get child_models(): LayoutDOM[]

  get child_views(): LayoutDOMView[] {
    return this.child_models.map((child) => this._child_views.get(child)!)
  }

  async build_child_views(): Promise<void> {
    await build_views(this._child_views, this.child_models, {parent: this})
  }

  override render(): void {
    this.empty()

    assign(this.el.style, this.model.style)

    const {background} = this.model
    this.el.style.backgroundColor = background != null ? color2css(background) : ""

    classes(this.el).clear().add(...this.css_classes())

    for (const child_view of this.child_views) {
      this.shadow_el.appendChild(child_view.el)
      child_view.render()
    }
  }

  abstract _update_layout(): void

  update_layout(): void {
    for (const child_view of this.child_views)
      child_view.update_layout()

    this._update_layout()
  }

  update_position(): void {
    this.el.style.display = this.model.visible ? "block" : "none"

    const margin = this.is_layout_root ? this.layout.sizing.margin : undefined
    position(this.el, this.layout.bbox, margin)

    for (const child_view of this.child_views)
      child_view.update_position()
  }

  after_layout(): void {
    for (const child_view of this.child_views)
      child_view.after_layout()

    this._has_finished = true
  }

  compute_viewport(): void {
    this._viewport = this._viewport_size()
  }

  override renderTo(element: Node): void {
    element.appendChild(this.el)
    this._offset_parent = this.el.offsetParent
    this.compute_viewport()
    this.build()
    this.notify_finished()
  }

  build(): this {
    if (!this.is_layout_root)
      throw new Error(`${this.toString()} is not a root layout`)

    this.render()
    this.update_layout()
    this.compute_layout()

    return this
  }

  async rebuild(): Promise<void> {
    await this.build_child_views()
    this.invalidate_render()
  }

  compute_layout(): void {
    const start = Date.now()
    this.layout.compute(this._viewport)
    this.update_position()
    this.after_layout()
    logger.debug(`layout computed in ${Date.now() - start} ms`)
  }

  resize_layout(): void {
    this.root.compute_viewport()
    this.root.compute_layout()
  }

  invalidate_layout(): void {
    this.root.update_layout()
    this.root.compute_layout()
  }

  invalidate_render(): void {
    this.render()
    this.invalidate_layout()
  }

  override has_finished(): boolean {
    if (!super.has_finished())
      return false

    for (const child_view of this.child_views) {
      if (!child_view.has_finished())
        return false
    }

    return true
  }

  protected _width_policy(): SizingPolicy {
    return this.model.width != null ? "fixed" : "fit"
  }

  protected _height_policy(): SizingPolicy {
    return this.model.height != null ? "fixed" : "fit"
  }

  box_sizing(): Partial<BoxSizing> {
    let {width_policy, height_policy, aspect_ratio} = this.model
    if (width_policy == "auto")
      width_policy = this._width_policy()
    if (height_policy == "auto")
      height_policy = this._height_policy()

    const {sizing_mode} = this.model
    if (sizing_mode != null) {
      if (sizing_mode == "fixed")
        width_policy = height_policy = "fixed"
      else if (sizing_mode == "stretch_both")
        width_policy = height_policy = "max"
      else if (sizing_mode == "stretch_width")
        width_policy = "max"
      else if (sizing_mode == "stretch_height")
        height_policy = "max"
      else {
        if (aspect_ratio == null)
          aspect_ratio = "auto"

        switch (sizing_mode) {
          case "scale_width":
            width_policy = "max"
            height_policy = "min"
            break
          case "scale_height":
            width_policy = "min"
            height_policy = "max"
            break
          case "scale_both":
            width_policy = "max"
            height_policy = "max"
            break
        }
      }
    }

    const sizing: Partial<BoxSizing> = {width_policy, height_policy}

    const {min_width, min_height} = this.model
    if (min_width != null)
      sizing.min_width = min_width
    if (min_height != null)
      sizing.min_height = min_height

    const {width, height} = this.model
    if (width != null)
      sizing.width = width
    if (height != null)
      sizing.height = height

    const {max_width, max_height} = this.model
    if (max_width != null)
      sizing.max_width = max_width
    if (max_height != null)
      sizing.max_height = max_height

    if (aspect_ratio == "auto" && width != null && height != null)
      sizing.aspect = width/height
    else if (isNumber(aspect_ratio))
      sizing.aspect = aspect_ratio

    const {margin} = this.model
    if (margin != null) {
      if (isNumber(margin))
        sizing.margin = {top: margin, right: margin, bottom: margin, left: margin}
      else if (margin.length == 2) {
        const [vertical, horizontal] = margin
        sizing.margin = {top: vertical, right: horizontal, bottom: vertical, left: horizontal}
      } else {
        const [top, right, bottom, left] = margin
        sizing.margin = {top, right, bottom, left}
      }
    }

    sizing.visible = this.model.visible

    const {align} = this.model
    if (isArray(align))
      [sizing.halign, sizing.valign] = align
    else
      sizing.halign = sizing.valign = align

    return sizing
  }

  protected _viewport_size(): Partial<Size> {
    return undisplayed(this.el, () => {
      let measuring: HTMLElement | null = this.el

      while (measuring = measuring.parentElement) {
        // .bk-root element doesn't bring any value
        if (measuring.classList.contains("bk-root"))
          continue

        // we reached <body> element, so use viewport size
        if (measuring == document.body) {
          const {margin: {left, right, top, bottom}} = extents(document.body)
          const width  = Math.ceil(document.documentElement.clientWidth  - left - right)
          const height = Math.ceil(document.documentElement.clientHeight - top  - bottom)
          return {width, height}
        }

        // stop on first element with sensible dimensions
        const {padding: {left, right, top, bottom}} = extents(measuring)
        const {width, height} = measuring.getBoundingClientRect()

        const inner_width = Math.ceil(width - left - right)
        const inner_height = Math.ceil(height - top - bottom)

        if (inner_width > 0 || inner_height > 0)
          return {
            width: inner_width > 0 ? inner_width : undefined,
            height: inner_height > 0 ? inner_height : undefined,
          }
      }

      // this element is detached from DOM
      return {}
    })
  }

  export(type: "png" | "svg", hidpi: boolean = true): CanvasLayer {
    const output_backend = type == "png" ? "canvas" : "svg"
    const composite = new CanvasLayer(output_backend, hidpi)

    const {width, height} = this.layout.bbox
    composite.resize(width, height)

    for (const view of this.child_views) {
      const region = view.export(type, hidpi)
      const {x, y} = view.layout.bbox
      composite.ctx.drawImage(region.canvas, x, y)
    }

    return composite
  }

  override serializable_state(): SerializableState {
    return {
      ...super.serializable_state(),
      bbox: this.layout.bbox.box,
      children: this.child_views.map((child) => child.serializable_state()),
    }
  }
}

export type FilterStrings<T> = {[K in keyof T & string as T[K] extends string ? K : never]?: T[K]}

export type CSSInlineStyle = FilterStrings<CSSStyleDeclaration>

export namespace LayoutDOM {
  export type Attrs = p.AttrsOf<Props>

  export type Props = UIElement.Props & {
    width: p.Property<number | null>
    height: p.Property<number | null>
    min_width: p.Property<number | null>
    min_height: p.Property<number | null>
    max_width: p.Property<number | null>
    max_height: p.Property<number | null>
    margin: p.Property<number | [number, number] | [number, number, number, number] | null>
    width_policy: p.Property<SizingPolicy | "auto">
    height_policy: p.Property<SizingPolicy | "auto">
    aspect_ratio: p.Property<number | "auto" | null>
    sizing_mode: p.Property<SizingMode | null>
    disabled: p.Property<boolean>
    align: p.Property<Align | [Align, Align]>
    background: p.Property<Color | null>
    css_classes: p.Property<string[]>
    style: p.Property<CSSInlineStyle>
    stylesheets: p.Property<string[]>
    context_menu: p.Property<Menu | null>
  }
}

export interface LayoutDOM extends LayoutDOM.Attrs {}

export abstract class LayoutDOM extends UIElement {
  override properties: LayoutDOM.Props
  override __view_type__: LayoutDOMView

  constructor(attrs?: Partial<LayoutDOM.Attrs>) {
    super(attrs)
  }

  static {
    this.define<LayoutDOM.Props>((types) => {
      const {Boolean, Number, String, Auto, Color, Array, Tuple, Dict, Or, Null, Nullable, Ref} = types
      const Number2 = Tuple(Number, Number)
      const Number4 = Tuple(Number, Number, Number, Number)
      return {
        width:         [ Nullable(Number), null ],
        height:        [ Nullable(Number), null ],
        min_width:     [ Nullable(Number), null ],
        min_height:    [ Nullable(Number), null ],
        max_width:     [ Nullable(Number), null ],
        max_height:    [ Nullable(Number), null ],
        margin:        [ Nullable(Or(Number, Number2, Number4)), [0, 0, 0, 0] ],
        width_policy:  [ Or(SizingPolicy, Auto), "auto" ],
        height_policy: [ Or(SizingPolicy, Auto), "auto" ],
        aspect_ratio:  [ Or(Number, Auto, Null), null ],
        sizing_mode:   [ Nullable(SizingMode), null ],
        disabled:      [ Boolean, false ],
        align:         [ Or(Align, Tuple(Align, Align)), "start" ],
        background:    [ Nullable(Color), null ],
        css_classes:   [ Array(String), [] ],
        style:         [ Dict(String), {} ], // TODO: add validation for CSSInlineStyle
        stylesheets:   [ Array(String), [] ],
        context_menu:  [ Nullable(Ref(Menu)), null ],
      }
    })
  }
}
