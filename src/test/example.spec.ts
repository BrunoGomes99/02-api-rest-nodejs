import { expect, it, describe, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { execSync } from 'node:child_process'
import { app } from '../app.ts'

// O describe é meramente informativo, apenas para categorizar os testes
describe('Transactions routes', () => {
  // O beforeAll define ações que devem ser feitas antes de todos os testes
  beforeAll(async () => {
    await app.ready()
  })

  // O afterAll define ações que devem ser feitas depois de todos os testes
  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    // Aqui usamos o execSync para rodar comandos do terminal
    // Estamos rodando o comando que faz a migration rollback e depois roda as migrations novamente
    // Isso é necessário para garantir que cada teste rode em um banco de dados zerado, sem dados de testes anteriores
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    // Para testarmos a listagem, precisamos do cookie id_session que é gerado quando criamos uma transação
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 5000,
        type: 'credit',
      })

    // Pega o cookie da resposta
    const cookies = createTransactionResponse.get('Set-Cookie') as string[]

    // Chama a listagem passando o cookie
    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    // Verifica se a listagem contém a um array que contém um objeto contendo pelo menos o title e amount da transação criada
    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New Transaction',
        amount: 5000,
      }),
    ])
  })

  it('should be able to get a specific transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New Transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie') as string[]

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New Transaction',
        amount: 5000,
      }),
    )
  })

  it('should be able to get the summary', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit Transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie') as string[]

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit Transaction',
        amount: 2000,
        type: 'debit',
      })

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual(
      expect.objectContaining({
        amount: 3000, // 5000 - 2000
      }),
    )
  })
})
