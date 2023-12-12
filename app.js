const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

let app = express()
app.use(express.json())

dbpath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDBandServer()

// API 1: Get a list of all todos whose status is TO DO
app.get('/todos/', async (request, response) => {
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  const hasPriorityAndStatusProperties = requestQuery => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    )
  }

  const hasPriorityProperty = requestQuery => {
    return requestQuery.priority !== undefined
  }

  const hasStatusProperty = requestQuery => {
    return requestQuery.status !== undefined
  }

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}'
          AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}';`
      break
    default:
      getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%';`
  }

  let data = await db.all(getTodosQuery)
  response.send(data)
})

// API 2: Get todo by ID
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoDetails = `
    SELECT
        *
    FROM
        todo
    WHERE
        id = ${todoId};`

  const todo = await db.get(getTodoDetails)
  response.send(todo)
})

// API 3: Add todo details
app.post('/todos/', async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status} = todoDetails

  const addTodoDetails = `
      INSERT INTO
        todo(id, todo, priority, status)
      VALUES
        (${id}, '${todo}', '${priority}', '${status}');`

  await db.run(addTodoDetails)
  response.send('Todo Successfully Added')
})

// API 4: Update todo details by ID
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let responseText = ''
  let {requestBody} = request.body

  switch (true) {
    case requestBody.status !== undefined:
      responseText = 'Status'
      break
    case requestBody.priority !== undefined:
      responseText = 'Priority'
      break
    case requestBody.todo !== undefined:
      responseText = 'Todo'
      break
  }

  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`

  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body

  const updateTodoDetails = `
    UPDATE
      todo
    SET       
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}'
    WHERE
      id = ${todoId};`

  await db.run(updateTodoDetails)
  response.send(`${responseText} Updated`)
})

// API 5: Delete todo by Id
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoDetails = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`

  await db.run(deleteTodoDetails)
  response.send('Todo Deleted')
})

module.exports = app
