import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createUiDomTest } from '@uninterface/testing/dom'
import {
  withStrategies,
  settleUntil,
} from '../../../tests/strategy-dom-fixture.mjs'
import { build } from './fixture-build.mjs'
import { uiDomTestAdapter } from './dom.mjs'
test('strategies retain native sizing, labels, annotations and feedback', () =>
  withStrategies(build, async (example, window) => {
    const ui = createUiDomTest(uiDomTestAdapter)
    const target = example.host.querySelector('[data-strategy-target="text"]')
    const input = target.matches('input')
      ? target
      : target.querySelector('input')
    input.focus()
    const button = example.host.querySelector('[data-strategy-target="button"]')
    {
      assert.ok(button.classList.contains('text-xs'))
      assert.ok(input.classList.contains('text-sm/4'))
    }
    {
      assert.ok(
        input
          .closest('.nuxt-strategy-field')
          .querySelector('[data-slot="help"]'),
        'native FormField feedback remains in use for ordinary replacement below',
      )
    }
    const backendPrefix = 'nuxt'
    const originalLabels = example.state.labels
    for (const labels of [originalLabels, undefined]) {
      example.state.labels = labels
      for (const mode of ['prefix', 'suffix', 'no', 'yes']) {
        example.state.requiredAnnotations = mode
        await example.tick()
        for (const controlName of [
          'text',
          'form-editor',
          'checkbox',
          'switch',
          'select',
        ]) {
          const control = example.host.querySelector(
            `[data-strategy-target="${controlName}"]`,
          )
          const field = control.closest('.nuxt-strategy-field')
          assert.ok(field, `${controlName} has a field`)
          const markers = field.querySelectorAll(`.${backendPrefix}-required`)
          if (mode === 'no') {
            assert.equal(
              markers.length,
              0,
              `${controlName}: no visible required annotation`,
            )
            if (controlName === 'checkbox' && labels === undefined) {
              assert.ok(
                field
                  .querySelector('[data-slot=label]')
                  .classList.contains('after:content-none'),
                'native checkbox marker is suppressed without removing required semantics',
              )
            }
          } else {
            assert.equal(
              markers.length,
              1,
              `${controlName}: one annotated label or control`,
            )
            assert.equal(
              markers[0].classList.contains(`${backendPrefix}-required-prefix`),
              mode === 'prefix',
            )
          }
        }
        const group = example.host.querySelector('[data-strategy-group]')
        assert.equal(
          group.querySelector(`.${backendPrefix}-required`),
          null,
          'query barrier preserves local no annotation',
        )
      }
    }
    example.state.blockRequiredGroup = false
    const groupField = example.host.querySelector('[data-strategy-group]')
    assert.ok(
      ui.fieldGroup(groupField).label?.textContent.includes('Required group'),
    )
    assert.ok(ui.fieldGroup(groupField).controlArea)
    for (const mode of ['prefix', 'suffix', 'yes', 'no']) {
      example.state.requiredAnnotations = mode
      await example.tick()
      const marker = groupField.querySelector(`.${backendPrefix}-required`)
      assert.equal(
        Boolean(marker),
        mode !== 'no',
        'group annotation follows its own strategy query',
      )
      if (marker) {
        assert.equal(
          marker.classList.contains(`${backendPrefix}-required-prefix`),
          mode === 'prefix',
        )
      }
      const requiredDescription = groupField.querySelector(
        `[id$="-required"], .plain-strategy-hidden`,
      )
      if (mode === 'no')
        assert.ok(
          requiredDescription,
          'group retains semantic required description',
        )
      const optionalField = example.host
        .querySelector('[data-strategy-target="blocked-editor"]')
        .closest('.nuxt-strategy-field')
      assert.equal(
        optionalField.querySelector(`.${backendPrefix}-required`),
        null,
        'optional field receives no annotation',
      )
    }
    example.state.blockRequiredGroup = true
    example.state.labels = originalLabels
    example.state.requiredAnnotations = 'yes'
    await example.tick()
    for (const [level, index] of [
      [-2, 0],
      [-1, 1],
      [0, 2],
      [1, 3],
      [2, 4],
    ]) {
      example.state.size = level
      await example.tick()
      {
        assert.ok(
          button.classList.contains(
            ['text-xs', 'text-xs', 'text-sm', 'text-sm', 'text-base'][index],
          ),
        )
      }
      {
        const field = input.closest('.nuxt-strategy-field')
        assert.ok(
          field.classList.contains(
            level < 0 ? 'text-xs' : level === 2 ? 'text-base' : 'text-sm',
          ),
          'native FormField typography follows size',
        )
        assert.equal(field.getAttribute('data-orientation'), 'horizontal')
        const blocked = example.host.querySelector(
          '[data-strategy-target="blocked-editor"]',
        )
        const blockedInput = blocked.matches('input')
          ? blocked
          : blocked.querySelector('input')
        assert.ok(
          blockedInput.classList.contains('text-base/5'),
          'a barrier restores native ordinary input size',
        )
      }
    }
    example.state.size = -1
    for (const limit of ['fieldOnly', 'sizeDepth']) {
      example.state[limit] = limit === 'fieldOnly' ? true : 1
      await example.tick()
      {
        assert.ok(
          input.closest('.nuxt-strategy-field').classList.contains('text-xs'),
        )
        assert.ok(input.classList.contains('text-base/5'))
      }
      example.state[limit] = limit === 'fieldOnly' ? false : undefined
    }
    await example.tick()
    for (const [name, control] of [
      ['text', example.text],
      ['checkbox', example.checkbox],
      ['select', example.selected],
    ]) {
      const surface = example.host.querySelector(
        `[data-strategy-target="${name}"]`,
      )
      const editor = surface.matches(
        'input,select,[role=checkbox],[role=combobox]',
      )
        ? surface
        : surface.querySelector(
            'input:not([type=hidden]),select,[role=checkbox],[role=combobox]',
          )
      control.state.issue = `Failure for ${name}`
      for (const mode of ['show-tooltip']) {
        example.state.failure = mode
        await example.tick()
        await settleUntil(
          example.tick,
          () =>
            mode === 'none'
              ? !ui.fieldFeedback(editor).message
              : ui.fieldFeedback(editor).tooltip,
          `native validation for ${name}/${mode}`,
        )
        const { message } = ui.fieldFeedback(editor)
        assert.ok(
          message.className.includes('tooltip-description'),
          'stable accessible error description survives portal lifecycle',
        )
      }
      control.state.issue = null
      await control.validate()
      await example.tick()
    }
    for (const position of ['above', 'beside', 'beside-far', 'beside-near']) {
      example.state.labels = position
      await example.tick()
      {
        const prefix = 'nuxt'
        assert.equal(
          Boolean(input.closest(`.${prefix}-labels-beside`)),
          position.startsWith('beside'),
          'beside requests resolve to a concrete beside alignment',
        )
      }
    }
    const checkableFields = [
      ...example.host.querySelectorAll('.nuxt-strategy-field'),
    ].filter((field) =>
      ['Strategy checkbox', 'Strategy switch'].some((label) =>
        field.textContent.includes(label),
      ),
    )
    for (const position of [
      undefined,
      'show',
      'above',
      'beside',
      'beside-far',
      'beside-near',
      'floating',
    ]) {
      example.state.labels = position
      await example.tick()
      for (const field of checkableFields) {
        {
          assert.equal(
            field.querySelector(':scope > [data-slot=labelWrapper]'),
            null,
          )
          assert.ok(field.querySelector('[data-slot=label]'))
          assert.ok(!field.classList.contains('nuxt-labels-beside'))
        }
      }
    }
    for (const position of ['show', 'floating', 'hidden', undefined]) {
      example.state.labels = position
      await example.tick()
      for (const name of ['text', 'select', 'checkbox', 'switch']) {
        const surface = example.host.querySelector(
          `[data-strategy-target="${name}"]`,
        )
        const editor = surface.matches(
          'input,select,[role=checkbox],[role=switch],[role=combobox]',
        )
          ? surface
          : surface.querySelector(
              'input:not([type=hidden]),select,[role=checkbox],[role=switch],[role=combobox]',
            )
        if (position === 'hidden' && !['checkbox', 'switch'].includes(name)) {
          const field = editor.closest('.nuxt-strategy-field')
          assert.ok(
            field.matches('.nuxt-labels-hidden'),
            `${name}: hidden retains the native visually hidden label`,
          )
        }
      }
    }
  }))
