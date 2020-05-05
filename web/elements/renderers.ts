import { Renderer } from '../../src/uvForm'
import { PropertyGroup, PropertyShape, Shape } from '@rdfine/shacl'
import { SafeClownface } from 'clownface'
import { html, TemplateResult } from 'lit-html'
import { NamedNode } from 'rdf-js'
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

  append(templateType, shape: PropertyShape, values: SafeClownface, set: any): void {
    this.inner.appendField(html`<div>
        <label>${shape.comment || (shape.name || shape.id).value}</label><br>
        ${this.inner.renderField(templateType, shape, values, set)}
    </div>`)
  }

  getResult(): LitHtmlResult {
    return this.inner.getResult()
  }
}

interface Components {
  textbox(templateType: NamedNode, shape: Shape, values: SafeClownface, set: any): TemplateResult
}

export class MaterialDesignComponents implements Components {
  textbox(templateType: NamedNode, shape: Shape, values: SafeClownface, set: any) {
    return html`<paper-input 
            type="text"
            .label="${shape.comment}"
            @value-changed="${(e: CustomEvent) => set(e.detail.value)}"
            .value="${values.value || ''}">`
  }
}

export class LitHtmlRenderer implements Renderer<LitHtmlResult> {
  private components: Components
  private result: TemplateResult = html``

  constructor(components: Components) {
    this.components = components
  }

  append(templateType: NamedNode, shape: Shape, values: SafeClownface, set: any): void {
    this.appendField(this.renderField(templateType, shape, values, set))
  }

  appendField(next: TemplateResult) {
    this.result = html`${this.result} ${next}`
  }

  renderField(templateType: NamedNode, shape: Shape, values: SafeClownface, set: any) {
    return this.components.textbox(templateType, shape, values, set)
  }

  getResult(): LitHtmlResult {
    return {
      render: () => this.result,
    }
  }
}

export class GroupingRenderer implements Renderer<LitHtmlResult> {
  private groups: Map<string, { group: PropertyGroup; groupRenderer: Renderer<LitHtmlResult> }> = new Map()
  private components: Components
  private selectedGroup = 0

  constructor(components: Components) {
    this.components = components
  }

  append(templateType: NamedNode, shape: Shape | PropertyShape, values: SafeClownface, changeCallback): void {
    if (!('group' in shape) || !shape.group) return

    let entry = this.groups.get(shape.group.id.value)
    if (!entry) {
      entry = { group: shape.group, groupRenderer: new LitHtmlRenderer(this.components) }
    }

    entry.groupRenderer.append(templateType, shape, values, changeCallback)
    this.groups.set(shape.group.id.value, entry)
  }

  getResult(): LitHtmlResult {
    return {
      render: () => {
        const orderedGroups = [...this.groups.values()]
          .sort((l, r) => (l.group.getNumber(sh.order) || 0) - (r.group.getNumber(sh.order) || 0))

        return html`<valle-tabs selected="${this.selectedGroup}" @selected-changed="${this.switchTab}">
            ${repeat(orderedGroups, this.renderTab)}
        </paper-tabs>`
      },
    }
  }

  private switchTab(e: CustomEvent) {
    this.selectedGroup = e.detail.value
  }

  private renderTab(g: { group: PropertyGroup; groupRenderer: Renderer<LitHtmlResult> }) {
    return html`<valle-tab title="${g.group.label}">${g.groupRenderer.getResult().render()}</paper-tab>`
  }
}
