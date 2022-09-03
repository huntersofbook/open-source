import { InjectionKey, effectScope, getCurrentInstance, inject } from 'vue'
import type { App, ComponentInternalInstance } from 'vue'
import { I18n, I18nInjectionKey, useI18n } from 'vue-i18n'

import autoAnimatePlugin from './auto-animate'
import { VueIhuntersofbook } from './vue-huntersofbook'
import { createComposer } from './composer'

declare module 'vue' {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface App<HostElement = any> {
    __VUE_HUNTERSOFBOOK_SYMBOL__?: InjectionKey<Ihuntersofbook> | string
  }
}

export interface IhuntersofbookPlugins {
  i18n: I18n
}

export interface Ihuntersofbook {

  readonly global: VueIhuntersofbook

  /**
    * Install entry point
    *
    * @param app - A target Vue app instance
    * @param options - An install options
    */
  install(app: App, ...options: unknown[]): void

}

export const createHuntersofbook = (plugins: IhuntersofbookPlugins): Ihuntersofbook => {
  const key = Symbol('huntersofbook') as InjectionKey<string>
  const [__global] = createGlobal(plugins)
  const huntersofbook = {
    async install(app: App) {
      app.use(autoAnimatePlugin)

      app.__VUE_HUNTERSOFBOOK_SYMBOL__ = key
      app.provide(app.__VUE_HUNTERSOFBOOK_SYMBOL__, huntersofbook as unknown as Ihuntersofbook)

      const unmountApp = app.unmount
      app.unmount = () => {
        unmountApp()
      }
    },
    get global() {
      return __global
    },
  }
  return huntersofbook
}

export function useHuntersofbook() {
  const instance = getCurrentInstance()
  console.log(instance?.appContext.app.__VUE_HUNTERSOFBOOK_SYMBOL__)
  if (instance == null)
    throw new Error('useHuntersofbook must be called in a Vue component')
  if (!instance.isCE
    && instance.appContext.app != null
    && !instance.appContext.app.__VUE_HUNTERSOFBOOK_SYMBOL__
  )
    throw new Error('useHuntersofbook not installed')

  const huntersofbook = getHuntersofbookInstance(instance)
  return huntersofbook
}

function getHuntersofbookInstance(instance: ComponentInternalInstance): Ihuntersofbook {
  console.log(instance.isCE, 'instance.isCE')
  const huntersofbook = inject(
    !instance.isCE
      ? instance.appContext.app.__VUE_HUNTERSOFBOOK_SYMBOL__ as InjectionKey<Ihuntersofbook>
      : '',
  )

  if (!huntersofbook)
    throw new Error('useHuntersofbook not installed')

  return huntersofbook
}

function createGlobal(
  plugins: IhuntersofbookPlugins,
): [VueIhuntersofbook] {
  const scope = effectScope()

  const obj = scope.run(() => createComposer(plugins)) as any
  if (obj == null)
    throw new Error('createGlobal must be called in a Vue component')

  return [obj]
}

export default createHuntersofbook
