import { app } from './app.ts'
import { env } from './env/index.ts'

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('HTTP server running!')
  })
