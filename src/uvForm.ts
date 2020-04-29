import { Shape } from '@rdfine/shacl/Shape'
import { BlankNode, NamedNode, Term } from 'rdf-js'
import { SafeClownface, SingleContextClownface } from 'clownface'
import { PropertyShape } from '@rdfine/shacl'
import PropertyShapeMixin from '@rdfine/shacl/PropertyShape'

export interface Renderer<TResult> {
  append(templateType: Term, shape: Shape, values: SafeClownface, changeCallback): void
  getResult(): TResult
}

interface UvFormParams<TRenderer extends Renderer<TResult>, TResult> {
  shape: Shape
  resource: SingleContextClownface<NamedNode | BlankNode>
  renderer: TRenderer
  matcher: ShapeMatcher
  changeListener?: ChangeListener
}

export interface ShapeMatcher {
  matchRenderer(shape: Shape, values: SafeClownface): Term
}

function getValue(pointer: SingleContextClownface, path: Term) {
  return pointer.out(path)
}

interface ChangeCallback {
  (resource: SingleContextClownface<NamedNode | BlankNode>, property: PropertyShape, value: any): void
}

export interface ChangeListener {
  onChange(cb: ChangeCallback): void
  notify(resource: SingleContextClownface<NamedNode | BlankNode>, property: PropertyShape, value: any): void
}

class Listener implements ChangeListener {
  private callbacks: ChangeCallback[] = []

  onChange(cb: ChangeCallback): void {
    this.callbacks.push(cb)
  }

  notify(resource: SingleContextClownface<NamedNode | BlankNode>, property: PropertyShape, value: any) {
    this.callbacks.forEach(cb => {
      cb(resource, property, value)
    })
  }
}

export function uvForm<TRenderer extends Renderer<TResult>, TResult>({ shape, resource, renderer, matcher, changeListener }: UvFormParams<TRenderer, TResult>): { result: TResult; changeListener: ChangeListener } {
  const listener = changeListener || new Listener()

  shape.property.forEach((property) => {
    const ps: PropertyShape = shape._create<PropertyShape>(property._selfGraph, [PropertyShapeMixin])
    const values = getValue(resource, ps.path.id)
    const templateType = matcher.matchRenderer(property, values)

    renderer.append(templateType, ps, values, (newValue) => {
      resource
        .deleteOut(ps.path.id)
        .addOut(ps.path.id, newValue)

      listener.notify(resource, property, newValue)
    })
  })

  return {
    changeListener: listener,
    result: renderer.getResult(),
  }
}
