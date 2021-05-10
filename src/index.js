const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  if (!username) {
    return response.status(400).json({
      error: 'Username necessário!'
    })
  }
  
  const user = users.find((user) => user.username === username);
  
  if (!user) {
    return response.status(404).json({
      error: 'Usuário não encontrado.'
    })
  }

  request.user = user;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some((user) => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({ error: 'Usuario ja cadastrado' })
  }

  const id = uuidv4();

  const user = { name, username, id, todos: [] };

  users.push(user);

  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const id = uuidv4();

  const todo = { title, deadline: new Date(deadline), id, done: false, created_at: new Date() };

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { id } = request.params;
  const { user } = request;

  let updatedTodo;

  const todos = user.todos.map((todo) => {
    if (todo.id === id) {
      updatedTodo = { ...todo, title, deadline: new Date(deadline) };
      return updatedTodo;
    }
    return todo;
  });

  if (!updatedTodo) {
    return response.status(404).json({ error: 'Todo não encontrado!' })
  }

  user.todos = todos;

  return response.status(201).json(updatedTodo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  let updatedTodo;

  const todos = user.todos.map((todo) => {
    if (todo.id === id) {
      updatedTodo = { ...todo, done: true };
      return updatedTodo;
    }
    return todo;
  });

  if (!updatedTodo) {
    return response.status(404).json({ error: 'Todo não encontrado!' })
  }

  user.todos = todos;

  return response.status(201).json(updatedTodo);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  let hasDeleted = false;

  const todos = user.todos.filter((todo) => {
    if (todo.id === id) {
      hasDeleted = true;
    }
    return todo.id !== id
  });

  if (!hasDeleted) {
    return response.status(404).json({ error: 'Todo não encontrado!' })
  }

  user.todos = todos;

  return response.status(204).send();
});

module.exports = app;