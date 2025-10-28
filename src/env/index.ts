import { config } from 'dotenv'
import { z } from 'zod'

// Aqui tem duas formas de buscar/validar as variáveis de ambiente
// 1. Usar a lib dotenv, que importa a dotnev/config e armazane as variáveis env na variável 'process.env'
// 2. Usar a lib zod para validar todas as variáveis de ambiente dentro de um schema padrão, ou seja, um modelo
//    que eu defino como padrão esperado para as variáveis de ambiente declaradas

// Primeiramente verificamos se a variável de ambiente NODE_ENV é 'test' (O vitest seta essa variável automaticamente)
if (process.env.NODE_ENV === 'test') {
  // se for, carregamos o .env.test
  config({ path: '.env.test' })
} else {
  // senão, carregamos o .env (usada no ambiente de desenvolvimento)
  config()
}

// Aqui dizemos que o zod vai validar um objeto que é o que conterá nossas variáveis de ambiente definidas em .env
const envSchema = z.object({
  // Aqui dizemos que esperamos que seja uma string. Como não colocamos valor padrão ou um 'nullable', essa variável é obrigatória
  // e dará erro caso não esteja definida
  DATABASE_URL: z.string(),

  // Aqui dizemos que esperamos um enum contendo essas 3 opções, mas se por um acaso não for passado nenhuma dessas
  // 3 opções, o padrão será 'development'
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),

  // Aqui passamos a porta que esperamos que seja um número, mas que tenha o valor padrão 3333, caso não seja informada
  PORT: z.coerce.number().default(3333),
})

// O safeParse irá validar as variáveis em .env, mas não irá lançar um erro caso algo esteja errado
// Fazemos isso pq queremos tratar o erro de forma personalizada
const _env = envSchema.safeParse(process.env)

// Aqui tratamos os erros
if (_env.success === false) {
  console.error('❌ Invalid environment variables:', _env.error.format())
  throw new Error('Invalid environment variables.')
}

export const env = _env.data
