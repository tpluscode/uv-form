import { Renderer } from '../../src/uvForm'
import { PropertyShape, Shape } from '@rdfine/shacl'
import { SafeClownface } from 'clownface'
import { html, TemplateResult } from 'lit-html'
import { NamedNode } from 'rdf-js'
import { dash } from '../../example/matcher'

export interface LitHtmlResult {
  render(): TemplateResult
}

export class NiceWrappedRenderer implements Renderer<LitHtmlResult> {
  private inner: LitHtmlRenderer

  constructor(inner: LitHtmlRenderer) {
    this.inner = inner
  }

  append(templateType, shape: PropertyShape, values: SafeClownface, set: any): void {
    this.inner.appendField(html`<div>
        <label>${(shape.name || shape.id).value}</label><br>
        ${this.inner.renderField(templateType, shape, values, set)}
    </div>`)
  }

  getResult(): LitHtmlResult {
    return this.inner.getResult()
  }
}

export class LitHtmlRenderer implements Renderer<LitHtmlResult> {
  private result: TemplateResult = html``

  append(templateType: NamedNode, shape: Shape, values: SafeClownface, set: any): void {
    this.appendField(this.renderField(templateType, shape, values, set))
  }

  appendField(next: TemplateResult) {
    this.result = html`${this.result} ${next}`
  }

  renderField(templateType: NamedNode, shape: Shape, values: SafeClownface, set: any) {
    let next: TemplateResult = html``

    if (templateType.equals(dash.TextAreaEditor)) {
      next = html`<textarea 
            type="text"
            @input="${(e: Event & any) => set(e.target.value)}"
            .value="${values.values || ''}"></textarea>`
    }

    return next
  }

  getResult(): LitHtmlResult {
    return {
      render: () => this.result,
    }
  }
}
