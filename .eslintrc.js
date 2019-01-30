module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017
  },
  plugins: [
    'node'
  ],
  extends: [
    'eslint:recommended',
    'plugin:node/recommended'
  ],
  env: {
    es6: true,
    node: true,
    mocha: true
  },
  rules: {
  }
};
