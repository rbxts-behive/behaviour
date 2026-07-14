import config from '@behive/eslint-config/roblox-ts.js'
import { defineConfig } from 'eslint/config'

export default defineConfig({ ignores: ['out/**/*'] }, config(import.meta.dirname))
