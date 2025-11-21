const http = require('http');

const host = '127.0.0.1';
const port = 3000;

let notes = [
  {
    id: 1,
    title: 'Сдать отчет',
    text: 'не забыть',
    tag: 4,
    updatedAt: new Date().toDateString()
  },
  {
    id: 2,
    title: 'Идеи для проекта',
    text: 'ляляля бебебе пупупу',
    tag: 2,
    updatedAt: new Date().toDateString()
  },
  {
    id: 3,
    title: 'Личные цели',
    text: 'москва сити',
    tag: 3,
    updatedAt: new Date().toDateString()
  },
  {
    id: 4,
    title: 'Покупки на неделю',
    text: 'кола зеро',
    tag: 5,
    updatedAt: new Date().toDateString()
  }
];

//  показывает что есть в памяти
function getAllNotes() {
  return notes;
}

function addNote(data) {
  const newNote = {
    id: notes.length > 0 ? Math.max(...notes.map(note => note.id)) + 1 : 1,
    title: data.title || 'Новая заметка',
    text: data.text || '',
    tag: data.tag || 1,
    updatedAt: new Date().toDateString()
  };
  notes.push(newNote); // добавляем новую заметку в массив
  return newNote;
}

function deleteNotes(id) {
  const noteIndex = notes.findIndex(note => note.id === id);
  if (noteIndex === -1) return false;
  notes.splice(noteIndex, 1);
  return true;
}

function updatedNote(data) {
  // проверка есть ли данные || id  
  if (!data || !data.id) return false;

  // ищем индекс заметки по id
  const noteIndex = notes.findIndex(note => note.id === data.id);
  if (noteIndex === -1) return false;
  
  notes[noteIndex] = { // обновляем все соединяя
    ...notes[noteIndex], // старые 
    ...data, // новые 
    updatedAt: new Date().toDateString()
  };
  
  return notes[noteIndex];
}

const server = http.createServer((req, res) => {
  // пускает к себе любой домен
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // проверка можно ли кинуть запрос
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  try {
    if (req.url === '/notes' && req.method === 'GET') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json'); // указываем возврат json
      res.end(JSON.stringify(getAllNotes())); // отправляем json
      return;
    }

    if (req.url === '/notes' && req.method === 'POST') {
      let body = [];
      req.on('data', chunk => body.push(chunk)); // собираем по частям 
      req.on('end', () => { // собрали B]
        try {
          const buffer = Buffer.concat(body); // все в буфер ака чанки 
          const rawDataString = buffer.toString(); // из чанков в строку
          const data = JSON.parse(rawDataString); // из строки в код 
          const newNote = addNote(data);
          
          res.statusCode = 201;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(newNote)); // отправляем созданную

          // если ошибка
        } catch (error) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'Invalid JSON data' }));
        }
      });
      return;
    }

    if (req.url === '/notes' && req.method === 'PATCH') { // запрос на обнову
      let body = [];
      req.on('data', chunk => body.push(chunk));
      req.on('end', () => {
        try {
          const buffer = Buffer.concat(body);
          const rawDataString = buffer.toString();
          const data = JSON.parse(rawDataString);
          const result = updatedNote(data);
          
          if (!result) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'Note not found' }));
            return;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));

        } catch (error) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'Invalid JSON data' }));
        }
      });
      return;
    }

    if (req.url === '/notes' && req.method === 'DELETE') {
      let body = [];
      req.on('data', chunk => body.push(chunk));
      req.on('end', () => {
        try {
          const buffer = Buffer.concat(body);
          const rawDataString = buffer.toString();
          const data = JSON.parse(rawDataString);
          
          if (!data.id) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'ID is required' }));
            return;
          }
          
          const result = deleteNotes(data.id); // если заметка не найдена
          if (!result) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'Note not found' }));
            return;
          }
          
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'Note deleted successfully' }));
        } catch (error) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'Invalid JSON data' }));
        }
      });
      return;
    }

    res.statusCode = 404; // если маршрут не найден
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Not found' }));

  } catch (error) {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ status: 'Internal server error' }));
  }
});

server.listen(port, host, () => { // запускаем сервер
  console.log(` Сервер запущен: http://${host}:${port}`);
});

// подушка безопасности
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});