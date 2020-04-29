import fromFile from 'rdf-utils-fs/fromFile'
import $rdf from 'rdf-ext'
import cf, { SafeClownface } from 'clownface'
import { resolve } from 'path'
import { WriteStream } from 'tty'
import { Term } from 'rdf-js'
import { Shape, PropertyShape } from '@rdfine/shacl'
import namespace from '@rdfjs/namespace'
import { Renderer, uvForm } from '../src/uvForm'
import { Matcher } from './matcher'

const ex = namespace('http://example.com/')

interface ConsoleResult {
  writeTo(out: WriteStream): void
}

class ConsoleRenderer implements Renderer<ConsoleResult> {
  private readonly lines: string[] = []

  append(templateType: Term, shape: Shape | PropertyShape, values: SafeClownface): void {
    let label = shape.id.value
    if ('name' in shape) {
      label = shape.name.value
    }

    this.lines.push(`Rendering ${templateType.value} for ${label} and values ${values.values}`)
  }

  getResult(): ConsoleResult {
    return {
      writeTo: (out: WriteStream): void => {
        this.lines.forEach(line => out.write(`${line}\n`))
      },
    }
  }
}

async function main() {
  const shapeDataset = await $rdf.dataset().import(fromFile(resolve(__dirname, 'shape.ttl')))
  const dataset = await $rdf.dataset().import(fromFile(resolve(__dirname, 'data.ttl')))

  const shapePointer = cf({ dataset: shapeDataset, term: ex.PersonShape })
  const resource = cf({ dataset, term: $rdf.namedNode('https://zazuko.com/People/Adrian') })

  const { result } = uvForm<ConsoleRenderer, ConsoleResult>({
    shapePointer,
    resource,
    renderer: new ConsoleRenderer(),
    matcher: new Matcher(),
  })

  result.writeTo(process.stdout)
}

main()
