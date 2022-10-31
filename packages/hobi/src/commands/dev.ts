import { statSync } from 'fs'
import { createHash } from 'node:crypto'

import chokidar from 'chokidar'
import consola from 'consola'
import { normalize, resolve } from 'pathe'
import { debounce } from 'perfect-debounce'

import { LoadHuntersofbookConfigOptions, loadHuntersofbookConfig } from '../loader/config'
import { HuntersofbookPluginCommand, PluginCommand, plugins } from '../plugins'
import { HuntersofbookConfig } from '../types'
import { IWatch } from '../types/watch'
import { getJson } from '../utils/hasCheckPackage'
import { QuestionPlugin } from '../utils/questions'
import * as time from '../utils/time'
import { resolveChokidarOptions } from '../utils/watch'
import { defineNuxtCommand } from './index'

const returnFilePath = (files: any[], cwd: string) => {
  const _files: string[] = []
  files.forEach((file) => {
    if (!file.includes('**'))
      _files.push(resolve(cwd, file))
    else
      _files.push(file)
  })
  return _files
}

export default defineNuxtCommand({
  meta: {
    name: 'dev',
    usage: 'hobi dev',
    description: 'Run Huntersofbook in development mode',
  },
  async invoke(args) {
    const rootDir = resolve(args._[0] || '.')
    const cwd = resolve(args.cwd || '.')

    let blockWatch: chokidar.WatchOptions = {}
    const ignored: string[] = []
    const __config = await loadHuntersofbookConfig({ cwd })

    const load = async (watch?: IWatch) => {
      const data = debounce(async () => {
        ignored.push(...returnFilePath(__config.blockedWatch?.files, cwd) || [])

        for await (const [key] of Object.entries(plugins)) {
          for await (const [_key] of Object.entries(__config)) {
            if (key === _key) {
              const cmd = await plugins[key as PluginCommand]() as HuntersofbookPluginCommand

              if (cmd.watch && cmd.watch.ignored)
                ignored.push(...returnFilePath(cmd.watch?.ignored, cwd))

              const data = await cmd.invoke(args, __config, watch)
              if (data.ignored)
                ignored.push(...returnFilePath(data.ignored, cwd))

              switch (data.status) {
                case 'wait':
                  break
                case 'error':
                  process.exit(1)
                  break
                case 'success':
                  process.exit(1)
                  break
              }
            }
          }
        }

        blockWatch = resolveChokidarOptions({
          ...__config.blockedWatch.options,
          ignored,
        })
      })

      await data()
    }

    const middleware = async () => {
      for await (const [key] of Object.entries(plugins)) {
        for await (const [_key] of Object.entries(__config)) {
          if (key === _key) {
            const cmd = await plugins[key as PluginCommand]() as HuntersofbookPluginCommand
            const pluginMiddleware = async (key: string, config: HuntersofbookConfig) => {
              if (cmd.middleware) {
                const data = await cmd.middleware(key, config)
                if (data && data.ignored)
                  ignored.push(...returnFilePath(data.ignored, cwd))
              }
            }
            pluginMiddleware(key, __config)
          }
        }
      }
    }

    await load()

    const watcher = chokidar.watch([rootDir], {
      ...blockWatch,
    })

    let modifiedTime: number
    let hexUrl: string

    const _plugins: QuestionPlugin[] = []
    const packageCheck = getJson(cwd)

    if (packageCheck && packageCheck.dependencies) {
      // eslint-disable-next-line dot-notation
      const depen = packageCheck.dependencies['hobia']
      // eslint-disable-next-line dot-notation
      const dev = (packageCheck.devDependencies ? packageCheck.devDependencies['hobia'] : undefined)

      if (!depen && !dev) {
        _plugins.push(...[
          {
            display: 'ttttttttt',
            name: 'compile-plugin',
            variants: [
              {
                name: 'ts-to-js',
                customCommand: 'bbbbbbbbbbbb',
                display: 'bbb',
              },
            ],
          }])
      }
    }

    watcher.on('all', async (event, _file) => {
      await middleware()

      const stats = statSync(_file)
      const file = normalize(_file)

      const isDirChange = ['addDir', 'unlinkDir'].includes(event)
      const isFileChange = ['add', 'unlink'].includes(event)
      const settingFile = file.match(/(huntersofbook\.config\.(js|ts|mjs|cjs))$/)

      if (ignored.find(item => item === _file) && !settingFile)
        return

      const hextPath = createHash('sha256').update(_file.toString()).digest('hex')
      if (hexUrl === hextPath || settingFile) {
        hexUrl = hextPath
        // consola.info(red('File is already compiled'), modifiedTime === +stats.mtime)
        // consola.info(red('File is already compiled'), +stats.mtime - modifiedTime)
        if (modifiedTime === +stats.mtime || (+stats.mtime - modifiedTime < 1500))
          return
        else
          modifiedTime = +stats.mtime
      }
      else { hexUrl = hextPath }

      if ((blockWatch.ignored as []).length > 0) {
        if ((blockWatch.ignored as []).find(item => item === file))

          return
      }

      await time.voidTimer(async (startTime) => {
        if (settingFile || !isDirChange || !isFileChange)
          await load({ event, file: _file, startTime })
      }, true)
    })

    return 'wait' as const
  },
})
