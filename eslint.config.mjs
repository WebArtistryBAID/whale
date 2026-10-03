import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const config = [
    ...nextVitals,
    ...nextTs,
    {
        rules: {
            // Advisory React Compiler rules; existing components predate them. Keep visible as warnings.
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/immutability': 'warn'
        }
    },
    {
        ignores: [ '.next/**', 'node_modules/**', 'src/generated/**', 'next-env.d.ts' ]
    }
]

export default config
