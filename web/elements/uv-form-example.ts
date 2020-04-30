import { LitElement, property, TemplateResult } from 'lit-element'
import { html } from 'lit-html'
import cf, { SingleContextClownface } from 'clownface'
import $rdf from 'rdf-ext'
import Parser from '@rdfjs/parser-n3'
import stringToStream from 'string-to-stream'
import namespace from '@rdfjs/namespace'
import './uv-form'
import { repeat } from 'lit-html/directives/repeat'
import { shrink } from '@zazuko/rdf-vocabularies'
import { rdf } from '@tpluscode/rdf-ns-builders'

const ex = namespace('http://example.com/')
const parser = new Parser()

const shape = `@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.com/> .
@prefix schema: <http://schema.org/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ex:PersonShape
  a sh:ClassShape ;
  sh:targetClass schema:Person ;
  sh:property [
    sh:path schema:name ;
    sh:name "Name" ;
    sh:datatype xsd:string ;
  ] ;
  sh:property [
    sh:path schema:knows ;
    sh:class schema:Person ;
] .`

const initialData = `@prefix zzk: <https://zazuko.com/People/> .
@prefix schema: <http://schema.org/> .

zzk:Adrian a schema:Person ;
           schema:knows [ a schema:Person ;
                          schema:name "Thomas" ] ;
           schema:name "Adrian" .
`

class UvFormExample extends LitElement {
  @property({ type: Object })
  public shape: SingleContextClownface

  @property({ type: Object })
  public resource: SingleContextClownface

  @property({ type: Object })
  public value: string

  async connectedCallback() {
    const dataset = await $rdf.dataset().import(parser.import(stringToStream(initialData)))
    this.resource = cf({ dataset, term: $rdf.namedNode('https://zazuko.com/People/Adrian') })

    const shapeDataset = await $rdf.dataset().import(parser.import(stringToStream(shape)))
    this.shape = cf({
      dataset: shapeDataset,
      term: ex.PersonShape,
    })

    super.connectedCallback()
  }

  public render() {
    return html`
<uv-form .shape="${this.shape}" .resource="${this.resource}" @changed="${this.formChanged}"></uv-form>

    <pre>${this.toJsonLd(this.resource)}</pre>
`
  }

  private toJsonLd(obj: SingleContextClownface, level = 0) {
    const indent = new Array(level * 2).fill(' ')
    const outQuads = $rdf.dataset([...obj.dataset.match(obj.term)]).clone()

    const jsonLdProps = html`,\n${repeat(outQuads, (quad, i) => {
      const seperator = i === (outQuads.size - 1) ? '' : ',\n'
      const property = quad.predicate.equals(rdf.type) ? '@type' : shrink(quad.predicate.value) || quad.predicate.value
      let value: TemplateResult
      if (property === '@type') {
        value = html`"${shrink(quad.object.value) || quad.object.value}"`
      } else if (quad.object.termType === 'Literal') {
        value = html`"${quad.object.value}"`
      } else {
        value = this.toJsonLd(obj.node(quad.object), level + 1)
      }
      return html`  ${indent}"${property}": ${value}${seperator}`
    })}`

    const id = obj.term.termType === 'BlankNode' ? html`_:${obj.value}` : shrink(obj.value) || obj.value

    return html`{\n  ${indent}"@id": "${id}"${jsonLdProps}\n${indent}}`
  }

  private formChanged(e: CustomEvent) {
    this.resource = e.detail.value
    this.requestUpdate('resource')
  }
}

customElements.define('uv-form-example', UvFormExample)
