import { defineHuntersofbookConfig } from 'hobi/config'

export default defineHuntersofbookConfig({
  deneme: 'asdsd',
  tsTOjs: [
    {
      inputFile: 'src/sw.ts',
      outputFile: 'public/sw.js',
    },
    {
      inputFile: 'src/sw.ts',
      outputFile: 'public/yen1i1.js',
    },
  ],
  blockedWatch: {
    files: ['public/sw.js', 'public/swasadsd.js'],
  },
})

