import { app } from './app.ts'
import { env } from './env/index.ts'

const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'

app
  .listen({
    host,
    port: env.PORT,
  })
  .then(() => {
    console.log('HTTP server running!')
  })
