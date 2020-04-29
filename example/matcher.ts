import { ShapeMatcher } from '../src/uvForm'
import { Shape } from '@rdfine/shacl/Shape'
import { PropertyShape } from '@rdfine/shacl'
import { SafeClownface } from 'clownface'
import { Term } from 'rdf-js'
import { owl, sh, xsd } from '@tpluscode/rdf-ns-builders'
import namespace from '@rdfjs/namespace'

export const dash = namespace('http://datashapes.org/dash#')

export class Matcher implements ShapeMatcher {
  matchRenderer(shape: Shape | PropertyShape, values: SafeClownface): Term {
    const datatype = shape.get(sh.datatype)

    if (datatype && datatype.id.equals(xsd.string)) {
      return dash.TextAreaEditor
    }

    return owl.Nothing
  }
}
