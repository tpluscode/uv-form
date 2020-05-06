import { Shape } from '@rdfine/shacl/Shape'
import { BlankNode, NamedNode, Term } from 'rdf-js'
import { SafeClownface, SingleContextClownface } from 'clownface'
import { PropertyShape } from '@rdfine/shacl'
import * as Shacl from '@rdfine/shacl'
import RdfResource from '@tpluscode/rdfine'

RdfResource.factory.addMixin(...Object.values(Shacl))

export interface AppendParams {
  templateType: Term
  shape: Shape | PropertyShape
  values: SafeClownface
  changeCallback: (value: Term | null) => void
}

export interface Renderer<TResult> {
  append(params: AppendParams): void
  getResult(): TResult
}

interface UvFormParams<TRenderer extends Renderer<TResult>, TResult> {
  shapePointer: SingleContextClownface<NamedNode | BlankNode>
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

export function uvForm<TRenderer extends Renderer<TResult>, TResult>({ shapePointer, resource, renderer, matcher, changeListener }: UvFormParams<TRenderer, TResult>): { result: TResult; changeListener: ChangeListener } {
  const listener = changeListener || new Listener()
  const shape = new Shacl.ShapeMixin.Class(shapePointer)

  shape.property.forEach((property) => {
    const values = getValue(resource, property.path.id)
    const templateType = matcher.matchRenderer(property, values)

    function changeCallback(newValue: Term) {
      resource
        .deleteOut(property.path.id)

      if (typeof newValue !== 'undefined' && newValue !== null) {
        resource.addOut(property.path.id, newValue)
      }

      listener.notify(resource, property, newValue)
    }

    renderer.append({
      templateType,
      shape: property,
      values,
      changeCallback,
    })
  })

  return {
    changeListener: listener,
    result: renderer.getResult(),
  }
}
