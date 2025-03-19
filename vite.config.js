import { defineConfig } from 'vite'
import postcssImport from 'postcss-import'
import postcssNesting from 'postcss-nesting'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  css: {
    postcss: {
      plugins: [
        postcssImport,
        postcssNesting
      ]
    }
  }
})