const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  globalIgnores(['dist/**', 'coverage/**', 'ios/**', 'android/**', '.expo/**']),
  expoConfig,
  prettierRecommended,
]);
