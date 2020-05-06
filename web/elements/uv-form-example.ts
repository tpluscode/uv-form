import { css, LitElement, property, query } from 'lit-element'
import { html } from 'lit-html'
import cf, { SingleContextClownface } from 'clownface'
import $rdf from 'rdf-ext'
import Parser from '@rdfjs/parser-n3'
import stringToStream from 'string-to-stream'
import namespace from '@rdfjs/namespace'
import { UvForm } from './uv-form'
import './uv-form'
import '@polymer/paper-button/paper-button'
import '@polymer/paper-input/paper-textarea'
import { defineCustomElements as defineSplitMe } from 'split-me/loader'
import shape from './shape.ttl'
import Validator from 'rdf-validate-shacl'

defineSplitMe(window)

const ex = namespace('http://matterhorn.tools/rdf/v1/')
const parser = new Parser()

class UvFormExample extends LitElement {
  @property({ type: Object })
  public shape: SingleContextClownface

  @property({ type: Object })
  public edited: SingleContextClownface

  @property({ type: Object })
  public saved = ''

  @property({ type: Object })
  public value: string

  @property({ type: Object })
  public validationReport: object | null

  @query('#form')
  private form: UvForm

  @query('paper-textarea')
  private raw: HTMLTextAreaElement

  private validator: any

  async connectedCallback() {
    this.edited = cf({ dataset: $rdf.dataset(), term: $rdf.namedNode('http://example.com/') })

    const shapeDataset = await $rdf.dataset().import(parser.import(stringToStream(shape)))
    this.shape = cf({
      dataset: shapeDataset,
      term: ex.IntellectualEntityShape,
    })
    this.validator = new Validator(this.shape.dataset)

    super.connectedCallback()
  }

  public static get styles() {
    return css`paper-textarea {
      width: 100%;
    }
    
    split-me {
      height: 100vh 
    }
    
    div[slot] {
      overflow: scroll;
      height: 100vh
    }`
  }

  public render() {
    return html`
      <split-me n="2">
        <div slot="0">
            <uv-form slot="0" id="form" .shape="${this.shape}" .resource="${this.edited}" .validationReport="${this.validationReport}"></uv-form>
            <paper-button slot="0" @click="${this.saveForm}">Serialize</paper-button>
        </div>

        <div slot="1">
            <paper-textarea .value="${this.saved}" rows="20"></paper-textarea>
            <paper-button @click="${this.updateForm}">Deserialize</paper-button>
        </div>
      </split-me>
`
  }

  private saveForm() {
    this.saved = this.form.resource.dataset.toString()
    const report = this.validator.validate(this.form.resource.dataset)
    this.validationReport = report.conforms ? null : report
  }

  private async updateForm() {
    const dataset = await $rdf.dataset().import(parser.import(stringToStream(this.raw.value)))
    this.edited = cf({ dataset, term: $rdf.namedNode('http://example.com/') })
  }
}

customElements.define('uv-form-example', UvFormExample)
