

import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';

const app = express();
const PORT = 5000;

// Configuração do middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 60 * 1000 }, 
  })
);


let usuarios = [];
let mensagens = [];

// Rota para servir arquivos estáticos
app.use(express.static('public'));

// Login
app.get('/login', (req, res) => {
  res.sendFile('login.html', { root: './views' });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validação simples para login (substitua por uma validação real)
  if (username === 'admin' && password === 'admin123') {
    req.session.loggedIn = true;
    res.cookie('lastAccess', new Date().toISOString(), { maxAge: 30 * 60 * 1000 }); // Último acesso
    res.redirect('/menu');
  } else {
    res.status(401).send('Credenciais inválidas');
  }
});

// Menu do sistema
app.get('/menu', (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/login');
  }

  const lastAccess = req.cookies.lastAccess || 'Primeiro acesso';
  res.send(`
    <h1>Menu</h1>
    <p>Último acesso: ${lastAccess}</p>
    <a href="/cadastroUsuario">Cadastrar Usuário</a><br>
    <a href="/usuarios">Lista de Usuários</a><br>
    <a href="/batePapo">Bate-papo</a><br>
    <a href="/logout">Logout</a>
  `);
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('lastAccess');
  res.redirect('/login');
});

// Cadastro de usuários
app.get('/cadastroUsuario', (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/login');
  }
  res.sendFile('cadastroUsuario.html', { root: './views' });
});

app.post('/cadastrarUsuario', (req, res) => {
  const { nome, dataNascimento, nickname } = req.body;

  if (!nome || !dataNascimento || !nickname) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }

  if (usuarios.find((user) => user.nickname === nickname)) {
    return res.status(400).send('Este nickname já está em uso.');
  }

  usuarios.push({ nome, dataNascimento, nickname });
  res.redirect('/usuarios');
});

// Lista de usuários cadastrados
app.get('/usuarios', (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/login');
  }
  let userList = '<h2>Usuários Cadastrados</h2><ul>';
  usuarios.forEach((user) => {
    userList += `<li>${user.nome} - ${user.nickname} - ${user.dataNascimento}</li>`;
  });
  userList += '</ul>';
  userList += '<a href="/cadastroUsuario">Voltar para o cadastro</a><br>';
  userList += '<a href="/menu">Voltar para o menu</a>';
  res.send(userList);
});

// Bate-papo
app.get('/batePapo', (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/login');
  }
  let userOptions = usuarios
    .map((user) => `<option value="${user.nickname}">${user.nickname}</option>`)
    .join('');

  let messageList = '<h2>Bate-papo</h2><ul>';
  mensagens.forEach((msg) => {
    messageList += `<li>${msg.nickname} (${msg.dataHora}): ${msg.mensagem}</li>`;
  });
  messageList += '</ul>';

  res.send(`
    ${messageList}
    <form action="/enviarMensagem" method="POST">
      <select name="nickname" required>
        <option value="">Selecione um usuário</option>
        ${userOptions}
      </select>
      <input type="text" name="mensagem" placeholder="Digite sua mensagem" required>
      <button type="submit">Enviar</button>
    </form>
    <a href="/menu">Voltar para o menu</a>
  `);
});

app.post('/enviarMensagem', (req, res) => {
  const { nickname, mensagem } = req.body;

  if (!nickname || !mensagem) {
    return res.status(400).send('Usuário e mensagem são obrigatórios!');
  }

  mensagens.push({
    nickname,
    mensagem,
    dataHora: new Date().toLocaleString(),
  });
  res.redirect('/batePapo');
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
app.use(express.static(path.join(process.cwd(), './pages/public')));