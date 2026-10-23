import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
export default [
 {ignores:['.next/**','node_modules/**','integrations/**','supabase/**','public/**']},
 {files:['app/**/*.{js,jsx,ts,tsx}','components/**/*.{js,jsx,ts,tsx}','lib/**/*.{js,mjs,ts}','tests/**/*.mjs'],languageOptions:{parser:tseslint.parser,ecmaVersion:'latest',sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}},globals:{...globals.browser,...globals.node}},plugins:{'react-hooks':hooks},rules:{...js.configs.recommended.rules,'no-unused-vars':'off','no-control-regex':'off','no-empty':['error',{allowEmptyCatch:true}],'react-hooks/rules-of-hooks':'error'}},
 {files:['**/*.{ts,tsx}'],rules:{'no-undef':'off'}}
];
