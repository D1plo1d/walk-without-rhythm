const fs = require('fs')

const DISTANCE_PER_MICRO_GCODE = 1 // uL
const SPEED = 10 // uL/s
const ROUND_TO_DECIMAL_PLACES = 2 // decimal places

const splitIntoMicroGCodes = ({
  positions,
  distances,
}) => {
  const longestMovement = Math.max(...Object.values(distances))
  const numberOfMoves = Math.ceil(longestMovement / DISTANCE_PER_MICRO_GCODE)

  const axes = Object.keys(distances)

  // the progress of the movement along each axis
  const progress = {...distances}
  Object.keys(progress).forEach((k) => progress[k] = 0)

  const output = []
  for (let i = 0; i <= numberOfMoves; i += 1) {
    axes.forEach((k) => {
      if ((progress[k] / distances[k]) < (i / numberOfMoves)) {
        let movement = (distances[k] > 0 ? 1 : -1) * DISTANCE_PER_MICRO_GCODE

        if (positions[k] + movement > distances[k]) {
          movement = distances[k] - positions[k]
        }

        positions[k] = positions[k] || 0
        positions[k] += movement
        progress[k] += movement

        output.push(
          `MANUAL_STEPPER STEPPER=${k} MOVE=${positions[k].toFixed(ROUND_TO_DECIMAL_PLACES)} SPEED=${SPEED}`
        )
      }
    })
  }

  return output
}

const walkWithoutRhythm = () => {
  const [inputFilename] = process.argv.slice(2)

  if (
    typeof inputFilename != 'string'
    || !inputFilename.endsWith('.gcode')
  ) {
    console.error('Example Useage: yarn walk-without-rhythm ./example.gcode')
    process.exit(1)
  }

  const input = fs.readFileSync(inputFilename, { encoding: 'utf8' })
  output = []

  const positions = {}

  input.split('\n').forEach((line) => {
    if (line.startsWith('//')) {
      return
    }
    if (line.startsWith('MOVE_BY')) {
      const distances = JSON.parse(line.replace(/MOVE_BY\s+/, ''))

      output = output.concat(splitIntoMicroGCodes({ positions, distances }))
    }
  })

  const outFilename = inputFilename.replace(/.gcode$/, '.bs.gcode')
  fs.writeFileSync(outFilename, output.join('\n'))
}

walkWithoutRhythm()
