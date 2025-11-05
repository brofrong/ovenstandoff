import { startWorker } from './src/core/worket'

const hasGFlag = process.argv.includes('-g')
startWorker(hasGFlag)
