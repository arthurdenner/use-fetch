import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';

const extensions = ['.ts', '.js'];

export default {
  input: 'src/index.ts',
  output: [
    { file: pkg.main, format: 'cjs', exports: 'named' },
    { file: pkg.module, format: 'esm' },
  ],
  external: Object.keys(pkg.peerDependencies || {}),
  plugins: [commonjs(), resolve(), babel({ extensions })],
};
