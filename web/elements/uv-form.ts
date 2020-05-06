import { LitElement, property } from 'lit-element'
import { SingleContextClownface } from 'clownface'
import { BlankNode, NamedNode } from 'rdf-js'
import { ChangeListener, Renderer, uvForm } from '../../src/uvForm'
import { html } from 'lit-html'
import { Matcher } from '../../example/matcher'
import {
  GroupingRenderer,
  LitHtmlResult,
  MaterialDesignComponents,
} from './renderers'

export class UvForm extends LitElement {
  @property({ type: Object })
  public shape!: SingleContextClownface<NamedNode | BlankNode>

  @property({ type: Object })
  public resource!: SingleContextClownface<NamedNode | BlankNode>

  @property({ type: Object })
  public validationReport: any

  public changeListener!: ChangeListener

  public render() {
    if (!this.shape && !this.resource) {
      return html``
    }

    const form = uvForm<Renderer<LitHtmlResult>, LitHtmlResult>({
      shapePointer: this.shape,
      matcher: new Matcher(),
      renderer: new GroupingRenderer(new MaterialDesignComponents()),
      resource: this.resource,
      validationReport: this.validationReport,
      changeListener: this.changeListener,
    })

    if (!this.changeListener) {
      this.changeListener = form.changeListener
      this.changeListener.onChange((resource) => {
        this.dispatchEvent(new CustomEvent('changed', {
          detail: {
            value: resource,
          },
        }))
      })
    }

    return form.result.render()
  }
}

customElements.define('uv-form', UvForm)
