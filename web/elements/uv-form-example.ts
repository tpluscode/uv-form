import { LitElement, property } from 'lit-element'
import { html } from 'lit-html'
import cf, { SingleContextClownface } from 'clownface'
import $rdf from 'rdf-ext'
import { Shape } from '@rdfine/shacl'
import { turtle } from '@tpluscode/rdf-string'
import Parser from '@rdfjs/parser-n3'
import stringToStream from 'string-to-stream'
import namespace from '@rdfjs/namespace'
import ShapeMixin from '@rdfine/shacl/Shape'
import './uv-form'

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
  public shape: Shape

  @property({ type: Object })
  public resource: SingleContextClownface

  @property({ type: Object })
  public value: string

  async connectedCallback() {
    const dataset = await $rdf.dataset().import(parser.import(stringToStream(initialData)))
    this.resource = cf({ dataset, term: $rdf.namedNode('https://zazuko.com/People/Adrian') })

    const shapeDataset = await $rdf.dataset().import(parser.import(stringToStream(shape)))
    this.shape = new ShapeMixin.Class({
      dataset: shapeDataset,
      term: ex.PersonShape,
    })

    super.connectedCallback()
  }

  public render() {
    return html`
<uv-form .shape="${this.shape}" .resource="${this.resource}" @changed="${this.formChanged}"></uv-form>

    <pre>${turtle`${this.resource.dataset}`.toString()}</pre>
`
  }

  private formChanged(e: CustomEvent) {
    this.resource = e.detail.value
    this.requestUpdate('resource')
  }
}

customElements.define('uv-form-example', UvFormExample)
