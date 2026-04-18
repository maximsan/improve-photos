import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules,
      'no-else-return': 'error',
      curly: ['error', 'all']
    }
  },
  {
    // Renderer lib files are pure utilities — no magic numbers allowed
    files: ['src/renderer/src/lib/**/*.ts'],
    rules: {
      'no-magic-numbers': [
        'error',
        { ignore: [0, 1, -1, 2], ignoreArrayIndexes: true, enforceConst: true }
      ]
    }
  },
  eslintConfigPrettier,
  // Must come after eslintConfigPrettier — prettier config sets curly:0 and would win otherwise
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      curly: ['error', 'all']
    }
  }
)
