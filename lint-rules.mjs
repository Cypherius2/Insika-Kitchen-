import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
import { readFileSync } from 'fs';
import { ESLint } from 'eslint';

async function lint() {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: {
      files: ['**/*.rules'],
      plugins: {
        '@firebase/security-rules': firebaseRulesPlugin,
      },
      rules: {
        '@firebase/security-rules/no-bit-operators': 'error',
      },
    },
  });

  const results = await eslint.lintFiles(['firestore.rules']);
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);
  console.log(resultText);
}

lint().catch(console.error);
