import { AppendParams, Renderer } from '../../src/uvForm'
import RDF from '@rdfjs/data-model'
import { html, TemplateResult } from 'lit-html'
import '@polymer/paper-input/paper-input'
import '@valle/valle-tabs/valle-tabs.js'
import { repeat } from 'lit-html/directives/repeat'
import { sh } from '@tpluscode/rdf-ns-builders'

export interface LitHtmlResult {
  render(): TemplateResult
}

export class NiceWrappedRenderer implements Renderer<LitHtmlResult> {
  private inner: LitHtmlRenderer

  constructor(inner: LitHtmlRenderer) {
    this.inner = inner
  }

  append(params: AppendParams): void {
    const { shape } = params

    this.inner.appendField(html`<div>
        <label>${shape.comment || shape.getString(sh.name) || shape.id.value}</label><br>
        ${this.inner.renderField(params)}
    </div>`)
  }

  getResult(): LitHtmlResult {
    return this.inner.getResult()
  }
}

interface Components {
  textbox(params: AppendParams): TemplateResult
}

export class MaterialDesignComponents implements Components {
  textbox({ shape, values, changeCallback, validationResults }: AppendParams) {
    return html`<paper-input 
            type="text"
            .label="${shape.comment}"
            .errorMessage="${validationResults[0] && validationResults[0].message}"
            ?invalid="${validationResults.length > 0}"
            @value-changed="${this.handleChange(changeCallback)}"
            .value="${values.value}">`
  }

  handleChange(changeCallback: AppendParams['changeCallback']) {
    return (e: CustomEvent) => {
      if (e.detail.value) {
        changeCallback(RDF.literal(e.detail.value))
      } else {
        changeCallback(null)
      }
    }
  }
}

export class LitHtmlRenderer implements Renderer<LitHtmlResult> {
  private components: Components
  private result: TemplateResult = html``

  constructor(components: Components) {
    this.components = components
  }

  append(params: AppendParams): void {
    this.appendField(this.renderField(params))
  }

  appendField(next: TemplateResult) {
    this.result = html`${this.result} ${next}`
  }

  renderField(params: AppendParams) {
    return this.components.textbox(params)
  }

  getResult(): LitHtmlResult {
    return {
      render: () => this.result,
    }
  }
}

export class GroupingRenderer implements Renderer<LitHtmlResult> {
  private groups: Map<string | null, { group: { label: string; order: number }; groupRenderer: Renderer<LitHtmlResult> }> = new Map()
  private components: Components
  private selectedGroup = 0

  constructor(components: Components) {
    this.components = components
  }

  append(params: AppendParams): void {
    const { shape } = params

    let group = { label: 'default group', order: -1 }
    let groupKey: string | null = null
    if ('group' in shape && shape.group) {
      groupKey = shape.group.id.value
      group = { label: shape.group.label, order: shape.group.getNumber(sh.order) || 0 }
    }

    let entry = this.groups.get(groupKey)
    if (!entry) {
      entry = { group, groupRenderer: new LitHtmlRenderer(this.components) }
    }

    entry.groupRenderer.append(params)
    this.groups.set(groupKey, entry)
  }

  getResult(): LitHtmlResult {
    return {
      render: () => {
        const orderedGroups = [...this.groups.values()]
          .sort((l, r) => l.group.order - r.group.order)

        return html`<valle-tabs selected="${this.selectedGroup}" @selected-changed="${this.switchTab}">
            ${repeat(orderedGroups, this.renderTab)}
        </paper-tabs>`
      },
    }
  }

  private switchTab(e: CustomEvent) {
    this.selectedGroup = e.detail.value
  }

  private renderTab(g: { group: { label: string }; groupRenderer: Renderer<LitHtmlResult> }) {
    return html`<valle-tab title="${g.group.label}">${g.groupRenderer.getResult().render()}</paper-tab>`
  }
}
