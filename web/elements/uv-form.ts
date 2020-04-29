import { LitElement, property } from 'lit-element'
import { Shape } from '@rdfine/shacl'
import { SingleContextClownface } from 'clownface'
import { BlankNode, NamedNode } from 'rdf-js'
import { ChangeListener, Renderer, uvForm } from '../../src/uvForm'
import { html } from 'lit-html'
import { Matcher } from '../../example/matcher'
import { LitHtmlRenderer, LitHtmlResult, NiceWrappedRenderer } from './renderers'

class UvForm extends LitElement {
  @property({ type: Object })
  public shape!: Shape

  @property({ type: Object })
  public resource!: SingleContextClownface<NamedNode | BlankNode>

  public changeListener!: ChangeListener

  public render() {
    if (!this.shape && !this.resource) {
      return html``
    }

    const form = uvForm<Renderer<LitHtmlResult>, LitHtmlResult>({
      shape: this.shape,
      matcher: new Matcher(),
      renderer: new NiceWrappedRenderer(new LitHtmlRenderer()),
      resource: this.resource,
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
