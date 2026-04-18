import js from '@eslint/js'
import globals from 'globals'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: {
      react: reactPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Without this, `no-unused-vars` flags `motion` / `m` used only as `<motion.div>` (false positives).
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^[A-Z_]',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: [
      'src/contexts/**/*.{js,jsx}',
      'src/dev/**/*.{js,jsx}',
      'src/components/navigation/ChannelDragMotion.jsx',
      'src/components/navigation/ChannelReorderVfx.jsx',
      'src/components/navigation/ChannelSlotDnd.jsx',
      'src/components/channels/channelModal/ChannelModalInlineMediaSuggestions.jsx',
      'src/components/dock/DockParticleSystem.jsx',
    ],
    rules: {
      // These modules export hooks, constants, or non-component helpers alongside components.
      'react-refresh/only-export-components': 'off',
    },
  },
])
