let currentEditingNote = null;
let notesData = {};
const API_URL = 'http://localhost:3000/notes';

// Загружаем заметки при запуске
loadNotes();

async function loadNotes() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network error');
        const notes = await response.json();
        notesData = {};
        
        notes.forEach(note => {
            notesData[note.id] = {
                id: note.id,
                title: note.title,
                text: note.text || '',
                tag: getTagTitle(note.tag),
                date: note.updatedAt
            };
        });
        
        renderSavedNotes();
        filterNotes('Все');
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        alert('Не удалось загрузить заметки. Убедитесь, что сервер запущен на localhost:3000');
    }
}

function getTagTitle(tagId) {
    const tags = {
        1: 'Все',
        2: 'Идеи', 
        3: 'Личное',
        4: 'Работа',
        5: 'Список покупок'
    };
    return tags[tagId] || 'Все';
}

function getTagId(tagTitle) {
    const tags = {
        'Все': 1,
        'Идеи': 2,
        'Личное': 3,
        'Работа': 4,
        'Список покупок': 5
    };
    return tags[tagTitle] || 1;
}

async function createNewNote() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: 'Новая заметка',
                text: '',
                tag: 1
            })
        });
        
        if (!response.ok) throw new Error('Create failed');
        const newNote = await response.json();
        
        // Добавляем в локальные данные
        notesData[newNote.id] = {
            id: newNote.id,
            title: newNote.title,
            text: newNote.text || '',
            tag: getTagTitle(newNote.tag),
            date: newNote.updatedAt
        };
        
        renderSavedNotes();
        
    } catch (error) {
        console.error('Ошибка создания:', error);
        alert('Не удалось создать заметку');
    }
}

function openNote(noteElement) {
    const noteId = noteElement.getAttribute('data-note-id');
    const note = notesData[noteId];
    
    currentEditingNote = noteElement;
    
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteText').value = note.text;
    document.getElementById('noteTag').value = note.tag;
    
    document.getElementById('notesListContainer').style.display = 'none';
    document.getElementById('noteEditor').style.display = 'block';
}

async function saveNote() {
    if (currentEditingNote) {
        const noteId = currentEditingNote.getAttribute('data-note-id');
        const note = notesData[noteId];
        
        const updatedData = {
            id: parseInt(noteId),
            title: document.getElementById('noteTitle').value,
            text: document.getElementById('noteText').value,
            tag: getTagId(document.getElementById('noteTag').value)
        };
        
        try {
            const response = await fetch(API_URL, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData)
            });
            
            if (!response.ok) throw new Error('Save failed');
            const result = await response.json();
            
            // Обновляем локальные данные
            note.title = updatedData.title;
            note.text = updatedData.text;
            note.tag = getTagTitle(updatedData.tag);
            note.date = result.updatedAt;
            
            // Обновляем отображение
            updateNoteElement(currentEditingNote, note);
            
            closeNote();
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Не удалось сохранить заметку');
        }
    }
}

function updateNoteElement(element, note) {
    element.querySelector('.note-title-text').textContent = note.title;
    element.querySelector('.note-tag').textContent = note.tag;
    element.querySelector('.note-preview').textContent = getTextPreview(note.text);
    element.querySelector('.zadachi_item_down span').textContent = note.date;
}

function renderSavedNotes() {
    const notesContainer = document.getElementById('notesContainer');
    notesContainer.innerHTML = '';
    
    for (const noteId in notesData) {
        const note = notesData[noteId];
        const noteElement = document.createElement('div');
        noteElement.className = 'zadachi_item';
        noteElement.setAttribute('data-note-id', note.id);
        noteElement.onclick = function() { openNote(this); };
        
        noteElement.innerHTML = `
            <div class="zadachi_item_top">
                <span class="note-title-text">${note.title}</span>
                <span class="note-tag">${note.tag}</span>
            </div>
            <div class="note-preview">${getTextPreview(note.text)}</div>
            <div class="zadachi_item_down"> 
                <span>${note.date}</span>
            </div>
        `;
        
        notesContainer.appendChild(noteElement);
    }
}

function closeNote() {
    document.getElementById('noteEditor').style.display = 'none';
    document.getElementById('notesListContainer').style.display = 'block';
    currentEditingNote = null;
}

async function deleteCurrentNote() {
    if (currentEditingNote && confirm('Удалить эту заметку?')) {
        const noteId = currentEditingNote.getAttribute('data-note-id');
        
        try {
            const response = await fetch(API_URL, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: parseInt(noteId) })
            });
            
            if (!response.ok) throw new Error('Delete failed');
            const result = await response.json();
            
            if (result.status === 'Note deleted successfully') {
                delete notesData[noteId];
                currentEditingNote.remove();
                closeNote();
            }
        } catch (error) {
            console.error('Ошибка удаления:', error);
            alert('Не удалось удалить заметку');
        }
    }
}

function filterNotes(selectedTag) {
    const allNotes = document.querySelectorAll('.zadachi_item');
    
    allNotes.forEach(note => {
        const noteTagElement = note.querySelector('.note-tag');
        const noteTag = noteTagElement ? noteTagElement.textContent : 'Все';
        
        if (selectedTag === 'Все' || noteTag === selectedTag) {
            note.style.display = 'flex';
        } else {
            note.style.display = 'none';
        }
    });
    
    document.querySelectorAll('.tegs_li').forEach(li => {
        li.classList.remove('active');
        if (li.textContent === selectedTag) {
            li.classList.add('active');
        }
    });
}

function getTextPreview(text) {
    if (!text || text.trim() === '') {
        return 'Текст заметки пока пуст...';
    }
    
    const maxLength = 120;
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    if (cleanText.length <= maxLength) {
        return cleanText;
    }
    
    return cleanText.substr(0, maxLength) + '...';
}

function searchNotes() {
    const searchText = document.getElementById('searchInput').value.toLowerCase().trim();
    const allNotes = document.querySelectorAll('.zadachi_item');
    
    if (searchText === '') {
        allNotes.forEach(note => {
            note.style.display = 'flex';
        });
        return;
    }
    
    allNotes.forEach(note => {
        const noteId = note.getAttribute('data-note-id');
        const noteData = notesData[noteId];
        
        const found = noteData.title.toLowerCase().includes(searchText) || 
                     noteData.text.toLowerCase().includes(searchText) ||
                     noteData.tag.toLowerCase().includes(searchText);
        
        note.style.display = found ? 'flex' : 'none';
    });
}