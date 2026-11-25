import { useLocale } from '@nuxt/ui/composables/useLocale'
import { createLocaleFixture } from '@uninterface/testing/fixtures/locale'

export const { mountLocale, renderLocale } = createLocaleFixture(() => {
  const { t } = useLocale()
  return () => t('selectMenu.noData')
})
