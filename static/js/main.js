// static/js/main.js

// --- THEME SWITCHING SETUP (REMOVED) ---
// const themeKey = 'selectedTheme';
// const themeSelector = document.getElementById('theme-selector');
// function applyTheme(theme) { /* ... */ }

// --- GLOBAL STATE & KEYS ---
let currentBook = {};
let currentChapterIndex = 0;
let chapterPrefix = '';
let remove_headings = true;
let linesToRemoveAtStart = 0;
let originalChapterContent = '';
let currentChunks = null;
let currentChunkIndex = 0;
let applySplitToAll = false;
const uploadedListKey = 'uploadedList';
const lastOpenedBookKey = 'lastOpenedBookFilename';

// --- DOM ELEMENTS ---
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('epub-file');
const addBookFileInput = document.getElementById('add-book-file-input');
const readerSection = document.getElementById('reader-section');
const characterCount = document.getElementById('character-count');
const chapterDropdown = document.getElementById('chapter-dropdown');
const prefixInput = document.getElementById('prefix-input');
const applyPrefixButton = document.getElementById('apply-prefix');
const prevChapterBtn = document.getElementById('prev-chapter');
const nextChapterBtn = document.getElementById('next-chapter');
const chapterTitle = document.getElementById('chapter-title');
const chapterContent = document.getElementById('chapter-content');
const copyButton = document.getElementById('copy-button');
const clearSplitButton = document.getElementById('clear-split');
const applyAllButton = document.getElementById('apply-all');
const splitCountInput = document.getElementById('split-count');
const splitButton = document.getElementById('split-button');
const chunkNav = document.getElementById('chunk-navigation');
const prevChunkBtn = document.getElementById('prev-chunk');
const nextChunkBtn = document.getElementById('next-chunk');
const chunkIndicator = document.getElementById('chunk-indicator');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const closeToast = document.getElementById('close-toast');
const libraryContainer = document.getElementById('uploaded-books');
const offcanvasMenu = document.getElementById('offcanvasMenu');
const headingsOnBtn = document.getElementById('headings-on');
const headingsOffBtn = document.getElementById('headings-off');
const linesToRemoveSection = document.getElementById('lines-to-remove-section'); // <<< NEW DOM ELEMENT
const linesToRemoveInput = document.getElementById('lines-to-remove-input');     // <<< NEW DOM ELEMENT
const menuToggleButton = document.getElementById('menu-toggle');
const closeMenuButton = document.getElementById('close-menu');
const uploadSection = document.getElementById('upload-section');


// --- MENU TOGGLE FUNCTION ---
function toggleMenu() {
  if (offcanvasMenu && menuToggleButton) {
    const isOpening = offcanvasMenu.classList.contains('-translate-x-full');
    offcanvasMenu.classList.toggle('-translate-x-full');
    offcanvasMenu.setAttribute('aria-hidden', (!isOpening).toString());
    menuToggleButton.setAttribute('aria-expanded', isOpening.toString());
    if (isOpening) {
      if (closeMenuButton) closeMenuButton.focus();
    } else {
      if (menuToggleButton) menuToggleButton.focus();
    }
  }
}

function updateHeadingsButtonsUI() {
    if (headingsOnBtn && headingsOffBtn) {
        // remove_headings = true means "Headings OFF" is active
        headingsOffBtn.classList.toggle('bg-blue-600', remove_headings); // Active state
        headingsOffBtn.classList.toggle('text-white', remove_headings);
        headingsOffBtn.classList.toggle('bg-gray-700', !remove_headings); // Inactive state
        headingsOffBtn.classList.toggle('text-gray-300', !remove_headings);
        headingsOffBtn.setAttribute('aria-pressed', remove_headings.toString());

        headingsOnBtn.classList.toggle('bg-blue-600', !remove_headings); // Active state
        headingsOnBtn.classList.toggle('text-white', !remove_headings);
        headingsOnBtn.classList.toggle('bg-gray-700', remove_headings); // Inactive state
        headingsOnBtn.classList.toggle('text-gray-300', remove_headings);
        headingsOnBtn.setAttribute('aria-pressed', (!remove_headings).toString());
    }
}

function populateChapterDropdown() {
  if (!chapterDropdown) return;
  chapterDropdown.innerHTML = '';
  if (currentBook.toc && currentBook.toc.length > 0) {
    currentBook.toc.forEach((chap, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = chap.title || `Chapter ${idx + 1}`;
      chapterDropdown.appendChild(opt);
    });
    chapterDropdown.value = currentChapterIndex;
  } else {
    const opt = document.createElement('option');
    opt.textContent = "No chapters available";
    opt.disabled = true;
    chapterDropdown.appendChild(opt);
  }
}

function saveBookState() {
  if (!currentBook || !currentBook.filename) return;
  const state = {
    chapterIndex: currentChapterIndex,
    splitSize: parseInt(splitCountInput.value, 10) || 0,
    prefix: prefixInput.value,
    remove_headings: remove_headings,
    linesToRemove: linesToRemoveAtStart, // <<< ADDED
    autoSplit: applySplitToAll
  };
  localStorage.setItem('book_' + currentBook.filename, JSON.stringify(state));
}

function restoreBookState() {

  if (!currentBook || !currentBook.filename) return;
  const raw = localStorage.getItem('book_' + currentBook.filename);
  if (!raw) {
    currentChapterIndex = 0;
    if (splitCountInput) splitCountInput.value = '';
    if (prefixInput) prefixInput.value = '';
    remove_headings = true;
    linesToRemoveAtStart = 0; // <<< Default for new state
    applySplitToAll = false;
  } else {
    const state = JSON.parse(raw);
    currentChapterIndex = state.chapterIndex || 0;
    if (splitCountInput) splitCountInput.value = state.splitSize || '';
    if (prefixInput) prefixInput.value = state.prefix || '';
    remove_headings = state.remove_headings === undefined ? true : state.remove_headings;
    linesToRemoveAtStart = state.linesToRemove || 0; // <<< Retrieve state
    applySplitToAll = state.autoSplit || false;
  }

  // Update the input field for lines to remove
  if (linesToRemoveInput) {
      linesToRemoveInput.value = linesToRemoveAtStart;
  }

  // Update visibility and disabled state of the lines-to-remove section
  // This logic is now also in toggleHeadings, but good to set it here on initial restore
  if (linesToRemoveSection && linesToRemoveInput) {
      if (remove_headings) { // If "Headings OFF"
          linesToRemoveSection.classList.remove('hidden');
          linesToRemoveInput.disabled = false;
      } else { // If "Headings ON"
          linesToRemoveSection.classList.add('hidden');
          linesToRemoveInput.disabled = true;
      }
  }

  if (chapterDropdown && currentBook.toc && currentBook.toc.length > 0) {
    if (currentChapterIndex >= currentBook.toc.length || currentChapterIndex < 0) {
        currentChapterIndex = 0;
    }
    chapterDropdown.value = currentChapterIndex;
  }
  updateHeadingsButtonsUI(); // Update the ON/OFF buttons for headings

  if (applyAllButton) {
    applyAllButton.classList.toggle('bg-blue-600', applySplitToAll); // Active state
    applyAllButton.classList.toggle('text-white', applySplitToAll);
    applyAllButton.classList.toggle('bg-gray-700', !applySplitToAll); // Inactive state
    applyAllButton.classList.toggle('text-gray-200', !applySplitToAll);
    applyAllButton.textContent = applySplitToAll ? 'Auto-Split: ON' : 'Auto-Split: OFF';
    applyAllButton.setAttribute('aria-pressed', applySplitToAll.toString());
  }
}

function addToLibrary(hashedFilename, metadataTitle, originalFilename) {
  const list = JSON.parse(localStorage.getItem(uploadedListKey) || '[]');
  const existingBookIndex = list.findIndex(item => item.filename === hashedFilename);
  const bookEntry = {
    filename: hashedFilename,
    title: metadataTitle || 'Unknown Title',
    originalFilename: originalFilename || 'unknown.epub'
  };
  if (existingBookIndex > -1) {
    list[existingBookIndex] = bookEntry;
  } else {
    list.push(bookEntry);
  }
  localStorage.setItem(uploadedListKey, JSON.stringify(list));
  renderUploadedList();
}

function renderUploadedList() {
  if (!libraryContainer) return;
  const list = JSON.parse(localStorage.getItem(uploadedListKey) || '[]');
  libraryContainer.innerHTML = '';
  if (list.length === 0) {
    libraryContainer.innerHTML = '<p class="text-gray-400 text-xs p-1 text-center">Your library is empty.</p>';
    return;
  }
  list.forEach(item => {
    const row = document.createElement('div');
    row.className = 'flex justify-between items-center mb-1 p-1.5 rounded hover:bg-gray-600 cursor-pointer';
    if (currentBook && currentBook.filename === item.filename) {
      row.classList.add('bg-blue-600', 'text-white');
      row.classList.remove('hover:bg-gray-600');
    }
    row.addEventListener('click', () => {
      loadBookFromLibrary(item.filename);
    });
    const titleSpan = document.createElement('span');
    titleSpan.className = 'text-xs truncate flex-grow mr-2';
    titleSpan.textContent = item.originalFilename || item.title || 'Untitled Book';
    titleSpan.title = `Open: ${item.originalFilename || item.title}\n(Metadata Title: ${item.title || 'N/A'})`;
    const deleteButton = document.createElement('button');
    deleteButton.className = 'text-red-400 hover:text-red-300 ml-1 px-1.5 py-0.5 text-xs flex-shrink-0 rounded focus:outline-none focus:ring-1 focus:ring-red-400';
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.title = `Delete: ${item.originalFilename || item.title}`;
    deleteButton.setAttribute('aria-label', `Delete ${item.originalFilename || item.title}`);
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      removeBook(item.filename, item.originalFilename || item.title);
    });
    row.appendChild(titleSpan);
    row.appendChild(deleteButton);
    libraryContainer.appendChild(row);
  });
}

function loadBookFromLibrary(hashedFilename) {
  if (currentBook && currentBook.filename === hashedFilename && readerSection && !readerSection.classList.contains('hidden')) {
    showMessage('This book is already open.');
    if (offcanvasMenu && !offcanvasMenu.classList.contains('-translate-x-full')) {
      toggleMenu();
    }
    return;
  }
  showGlobalSpinner(true, 'Loading book from library...');
  fetch(`upload.php?load_book=${encodeURIComponent(hashedFilename)}`)
    .then(response => response.json())
    .then(data => {
      showGlobalSpinner(false);
      if (data.success && data.filename && data.metadata && data.toc && data.original_filename) {
        initializeBook(data);
        if (offcanvasMenu && !offcanvasMenu.classList.contains('-translate-x-full')) {
          toggleMenu();
        }
      } else {
        showMessage(data.error || 'Failed to load book from library.');
        const libraryList = JSON.parse(localStorage.getItem(uploadedListKey) || '[]');
        const bookInList = libraryList.find(b => b.filename === hashedFilename);
        if (data.error && data.error.toLowerCase().includes("not found") && bookInList) {
           if (confirm(`"${bookInList.originalFilename || bookInList.title}" not found on server. Remove from your library list?`)) {
              let newList = libraryList.filter(x => x.filename !== hashedFilename);
              localStorage.setItem(uploadedListKey, JSON.stringify(newList));
              renderUploadedList();
           }
        }
      }
    })
    .catch(err => {
      showGlobalSpinner(false);
      showMessage('Error fetching book data: ' + err);
      console.error('[loadBookFromLibrary] Fetch error:', err);
    });
}

function showGlobalSpinner(show, message = 'Processing...') {
    let spinner = document.getElementById('global-spinner');
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.id = 'global-spinner';
        spinner.className = 'fixed inset-0 w-full h-full bg-gray-900 bg-opacity-75 flex flex-col justify-center items-center z-[10000]';
        spinner.innerHTML = `
            <svg class="animate-spin h-10 w-10 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-3 text-white text-lg"></p>`;
        document.body.appendChild(spinner);
    }
    const spinnerText = spinner.querySelector('p');
    if (spinnerText) spinnerText.textContent = message;
    if (show) {
        spinner.classList.remove('hidden');
        spinner.style.display = 'flex';
    } else {
        spinner.classList.add('hidden');
        spinner.style.display = 'none';
    }
}

function removeBook(hashedFilename, bookDisplayTitle) {
  if (!window.confirm(`Are you sure you want to delete "${bookDisplayTitle}" and all its data? This cannot be undone.`)) {
    return;
  }
  showGlobalSpinner(true, `Removing "${bookDisplayTitle}"...`);
  fetch(`remove_file.php?filename=${encodeURIComponent(hashedFilename)}`)
    .then(r => r.json())
    .then(data => {
      showGlobalSpinner(false);
      if (data.success) {
        showMessage(`"${bookDisplayTitle}" removed successfully.`);
        let list = JSON.parse(localStorage.getItem(uploadedListKey) || '[]');
        list = list.filter(x => x.filename !== hashedFilename);
        localStorage.setItem(uploadedListKey, JSON.stringify(list));
        localStorage.removeItem('book_' + hashedFilename);
        if (localStorage.getItem(lastOpenedBookKey) === hashedFilename) {
            localStorage.removeItem(lastOpenedBookKey);
        }
        if (currentBook && currentBook.filename === hashedFilename) {
          resetReaderUI();
        }
        renderUploadedList();
      } else {
        showMessage(data.error || `Failed to remove "${bookDisplayTitle}".`);
      }
    })
    .catch(err => {
      showGlobalSpinner(false);
      showMessage('Error during removal: ' + err);
      console.error('[removeBook] Fetch error:', err);
    });
}

function resetReaderUI() {
  if (readerSection) readerSection.classList.add('hidden');
  if (uploadSection) uploadSection.classList.remove('hidden');
  currentBook = {};
  currentChapterIndex = 0;
  originalChapterContent = '';
  currentChunks = null;
  currentChunkIndex = 0;
  chapterPrefix = '';
  remove_headings = true;
  applySplitToAll = false;
  if (chapterDropdown) chapterDropdown.innerHTML = '<option>No Book Loaded</option>';
  if (chapterTitle) chapterTitle.textContent = 'EPUB Reader';
  if (chapterContent) {
    chapterContent.innerHTML = '<p class="text-gray-400">Upload an EPUB file or select one from your library to begin reading.</p>';
  }
  updateCharacterCount(chapterContent ? chapterContent.textContent : ""); // Count placeholder or 0
  if (characterCount) characterCount.textContent = 'Chars: 0';
  if (chunkIndicator) chunkIndicator.textContent = "";
  if (splitCountInput) splitCountInput.value = '';
  if (prefixInput) prefixInput.value = '';
  updateNavigationButtons();
  clearSplit();
  if (fileInput) fileInput.value = '';
  if (addBookFileInput) addBookFileInput.value = '';
  updateHeadingsButtonsUI();
  if (applyAllButton) {
      applyAllButton.classList.remove('bg-blue-600', 'text-white');
      applyAllButton.classList.add('bg-gray-700', 'text-gray-200');
      applyAllButton.textContent = 'Auto-Split: OFF';
      applyAllButton.setAttribute('aria-pressed', 'false');
  }
}

function renderParagraphs(text) {
  if (!chapterContent) return;
  chapterContent.innerHTML = '';
  if (typeof text !== 'string') {
    text = String(text || '');
  }
  const paragraphs = text.split(/\n{2,}/);
  paragraphs.forEach(par => {
    const p = document.createElement('p');
    p.textContent = par.trim();
    chapterContent.appendChild(p);
  });
}

function toggleHeadings(shouldRemove) {
  remove_headings = shouldRemove; // 1. Update the global state
  updateHeadingsButtonsUI();      // 2. Update the button appearance

  if (linesToRemoveSection && linesToRemoveInput) {
    if (remove_headings) { // "Headings OFF" is active
      linesToRemoveSection.classList.remove('hidden');
      linesToRemoveInput.disabled = false;
      // Read the current value from the input when showing it
      linesToRemoveAtStart = parseInt(linesToRemoveInput.value, 10) || 0;
    } else { // "Headings ON" is active
      linesToRemoveSection.classList.add('hidden');
      linesToRemoveInput.disabled = true;
      // Optional: Reset linesToRemoveAtStart if you want it to clear when headings are turned ON
       linesToRemoveAtStart = 0;
       linesToRemoveInput.value = 0;
    }
  }
 

  if (currentBook.toc && currentBook.toc.length > 0 && currentBook.toc[currentChapterIndex]) {
    clearSplit();                 // Clear any existing text splitting
    loadChapter(currentBook.toc[currentChapterIndex].id); // 3. Reload the current chapter
  }
  saveBookState();                // 4. Save this preference
}


function changeChunk(delta) {
  if (!currentChunks) return;
  const newIndex = currentChunkIndex + delta;
  if (newIndex < 0 || newIndex >= currentChunks.length) return;
  currentChunkIndex = newIndex;
  renderCurrentChunk();
}

function loadPreviousChapter() {
  if (currentBook.toc && currentBook.toc.length > 0 && currentChapterIndex > 0) {
    currentChapterIndex--;
    if (chapterDropdown) chapterDropdown.value = currentChapterIndex;
    clearSplit();
    loadChapter(currentBook.toc[currentChapterIndex].id);
  }
}

function loadNextChapter() {
  if (currentBook.toc && currentChapterIndex < currentBook.toc.length - 1) {
    currentChapterIndex++;
    if (chapterDropdown) chapterDropdown.value = currentChapterIndex;
    clearSplit();
    loadChapter(currentBook.toc[currentChapterIndex].id);
  }
}

function handleChapterSelect() {
  if (!chapterDropdown || !currentBook.toc) return;
  const newIndex = parseInt(chapterDropdown.value, 10);
  if (newIndex !== currentChapterIndex && currentBook.toc[newIndex]) {
    currentChapterIndex = newIndex;
    clearSplit();
    loadChapter(currentBook.toc[currentChapterIndex].id);
  }
}

async function loadChapter(chapterId) {
  if (!currentBook.filename || !chapterId) {
    if (chapterTitle) chapterTitle.textContent = "Error";
    if (chapterContent) chapterContent.innerHTML = "<p>Cannot load chapter: Book or Chapter ID missing.</p>";
    if (chunkIndicator) chunkIndicator.textContent = "";
    showGlobalSpinner(false);
    return;
  }
  const chapterInfo = currentBook.toc.find(c => c.id === chapterId);
  showGlobalSpinner(true, `Loading: ${chapterInfo?.title || 'Chapter'}...`);
  try {
    let url = `get_chapter.php?filename=${encodeURIComponent(currentBook.filename)}&chapter_id=${encodeURIComponent(chapterId)}&remove_headings=${remove_headings}`;
    if (remove_headings && linesToRemoveAtStart > 0) {
        url += `&lines_to_skip_at_start=${linesToRemoveAtStart}`;
    }
    const resp = await fetch(url);
    const data = await resp.json();
    showGlobalSpinner(false);
    if (!resp.ok || data.error) throw new Error(data.error || 'Failed to load chapter');
    if (chapterTitle) chapterTitle.textContent = data.chapter.title;
    
    originalChapterContent = data.chapter.content; // Content from server (already processed for headings/lines_to_skip)
    const fullChapterTextForCount = chapterPrefix + originalChapterContent; // Combine with current prefix
    updateCharacterCount(fullChapterTextForCount);    // <<< UPDATE COUNT WITH FULL CHAPTER TEXT

    const contentToDisplay = chapterPrefix + originalChapterContent;
    clearSplit();

    renderParagraphs(contentToDisplay); // Render full content or first chunk if auto-split
    
    updateNavigationButtons();
    if (chunkIndicator) chunkIndicator.textContent = "";
    
    const splitSize = parseInt(splitCountInput.value, 10);
    if (applySplitToAll && splitSize > 0) {
      splitChapterContent(); // This will display chunks but not change the overall chapter count
    } else {
      if (chunkNav) chunkNav.classList.add('hidden');
    }
    saveBookState();
  } catch (err) {
    showGlobalSpinner(false);
    showMessage('Error loading chapter: ' + err.message);
    console.error('[loadChapter] Error:', err);
    if (chapterTitle) chapterTitle.textContent = "Error Loading Chapter";
    if (chapterContent) {
        chapterContent.innerHTML = `<p class="text-red-300">Could not load chapter content: ${err.message}</p>`;
    }
    updateCharacterCount(""); // Error state, count is 0 or based on error message
  }
}

function splitTextIntoChunks(text, chunkSize) {
  if (!text || typeof text !== 'string' || chunkSize <= 0) return [];
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + chunkSize;
    if (end >= text.length) {
      chunks.push(text.substring(start));
      break;
    }
    let breakPoint = -1;
    let tempEnd = Math.min(end + Math.floor(chunkSize * 0.2), text.length);
    breakPoint = text.lastIndexOf('\n\n', tempEnd);
    if (breakPoint < start) breakPoint = -1;
    if (breakPoint === -1) {
      breakPoint = text.lastIndexOf('\n', tempEnd);
      if (breakPoint < start) breakPoint = -1;
    }
    if (breakPoint === -1) {
        breakPoint = text.lastIndexOf(' ', tempEnd);
        if (breakPoint < start) breakPoint = -1;
    }
    if (breakPoint === -1 || breakPoint <= start) {
        breakPoint = end;
    }
    chunks.push(text.substring(start, breakPoint).trim());
    start = breakPoint;
    while (start < text.length && (text[start] === '\n' || text[start] === ' ')) {
        start++;
    }
  }
  return chunks.filter(chunk => chunk.length > 0);
}

function splitChapterContent() {
  if (!splitCountInput) return;
  const size = parseInt(splitCountInput.value, 10);
  if (isNaN(size) || size <= 0) {
    showMessage('Enter a valid split size (positive number).');
    return;
  }
  currentChunks = splitTextIntoChunks(originalChapterContent, size);
  if (!currentChunks || currentChunks.length === 0) {
    showMessage('No content to split or content too short for this size.');
    clearSplit();
    const contentToDisplay = chapterPrefix + originalChapterContent;
    renderParagraphs(contentToDisplay);
    //updateCharacterCount(contentToDisplay);
    if (chunkNav) chunkNav.classList.add('hidden');
    return;
  }
  currentChunkIndex = 0;
  renderCurrentChunk();
  if (clearSplitButton) clearSplitButton.classList.remove('hidden');
  showMessage(`Split into ${currentChunks.length} chunk(s).`);
  saveBookState();
}

function renderCurrentChunk() {
  if (!currentChunks || currentChunkIndex < 0 || currentChunkIndex >= currentChunks.length) {
    clearSplit();
    const contentToDisplay = chapterPrefix + originalChapterContent;
    renderParagraphs(contentToDisplay);
   // updateCharacterCount(contentToDisplay);
    if (chunkNav) chunkNav.classList.add('hidden');
    return;
  }
  const chunkText = chapterPrefix + currentChunks[currentChunkIndex];
  renderParagraphs(chunkText);
  if (chunkIndicator) chunkIndicator.textContent = `Chunk ${currentChunkIndex + 1} of ${currentChunks.length}`;
  //updateCharacterCount(chunkText);
  if (prevChunkBtn) prevChunkBtn.disabled = currentChunkIndex === 0;
  if (nextChunkBtn) nextChunkBtn.disabled = currentChunkIndex === currentChunks.length - 1;
  if (chunkNav) chunkNav.classList.remove('hidden');
}

function clearSplit() {
  currentChunks = null;
  currentChunkIndex = 0;
  if (clearSplitButton) clearSplitButton.classList.add('hidden');
  if (chunkNav) chunkNav.classList.add('hidden');
  if (chunkIndicator) chunkIndicator.textContent = "";
}

function updateCharacterCount(text) {
  if (!characterCount) return;

  const cnt = (typeof text === 'string' ? text.length : 0);
  characterCount.textContent = `Chars: ${cnt}`;
  characterCount.classList.toggle('text-yellow-500', cnt > 2500);
  characterCount.classList.toggle('text-gray-400', cnt <= 2500);
}

function updateNavigationButtons() {
  if (prevChapterBtn) prevChapterBtn.disabled = currentChapterIndex === 0;
  if (nextChapterBtn) nextChapterBtn.disabled = !currentBook.toc || currentBook.toc.length === 0 || currentChapterIndex >= currentBook.toc.length - 1;
  if(currentChunks && currentChunks.length > 0) {
    if (prevChunkBtn) prevChunkBtn.disabled = currentChunkIndex === 0;
    if (nextChunkBtn) nextChunkBtn.disabled = currentChunkIndex >= currentChunks.length - 1;
  } else {
    if (prevChunkBtn) prevChunkBtn.disabled = true;
    if (nextChunkBtn) nextChunkBtn.disabled = true;
  }
}

function applyPrefix() {
  if (!prefixInput) return;
  chapterPrefix = prefixInput.value;

  const fullChapterTextForCount = chapterPrefix + originalChapterContent;
  updateCharacterCount(fullChapterTextForCount); // <<< UPDATE COUNT WITH NEW PREFIX

  if (currentChunks && currentChunks.length > 0) {
    renderCurrentChunk(); // This will display the chunk with the new prefix
  } else if (originalChapterContent || (chapterContent && chapterContent.innerHTML && !chapterContent.innerHTML.includes("Upload an EPUB file"))) {
    const contentToDisplay = chapterPrefix + originalChapterContent;
    renderParagraphs(contentToDisplay);
  }
  showMessage('Prefix applied.');
  saveBookState();
}

function copyRenderedContent() {
  if (!chapterContent) return;
  const paragraphs = Array.from(chapterContent.querySelectorAll('p'))
    .map(p => p.textContent.trim());
  const textToCopy = paragraphs.join('\n\n');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(textToCopy)
      .then(() => showMessage('Copied to clipboard!'))
      .catch(err => {
        console.warn('Clipboard API copy failed, trying fallback:', err);
        fallbackCopy(textToCopy);
      });
  } else {
    console.warn('Clipboard API not available, using fallback.');
    fallbackCopy(textToCopy);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.top = '-9999px';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  try {
    const successful = document.execCommand('copy');
    if (successful) {
        showMessage('Copied to clipboard (fallback).');
    } else {
        throw new Error('execCommand copy failed');
    }
  } catch (err) {
    showMessage('Copy failed. Please copy manually.');
    console.error('Fallback copy failed:', err);
  }
  document.body.removeChild(ta);
}

let messageTimeout;
function showMessage(msg) {
  if (!messageBox || !messageText) return;
  messageText.textContent = msg;
  messageBox.classList.remove('hidden');
  void messageBox.offsetWidth;
  messageBox.classList.remove('opacity-0');
  messageBox.classList.add('opacity-100');
  clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => {
    messageBox.classList.remove('opacity-100');
    messageBox.classList.add('opacity-0');
    setTimeout(() => messageBox.classList.add('hidden'), 300);
  }, 3000);
}

async function processAndUploadFile(fileToUpload) {
    if (!fileToUpload) {
        return showMessage('No file selected for upload.');
    }
    if (!fileToUpload.name.toLowerCase().endsWith('.epub')) {
        return showMessage('Invalid file type. Only .epub files are allowed.');
    }
    showGlobalSpinner(true, 'Uploading and processing EPUB...');
    const formData = new FormData();
    formData.append('file', fileToUpload);
    try {
        const resp = await fetch('upload.php', { method: 'POST', body: formData });
        const data = await resp.json();
        showGlobalSpinner(false);
        if (!resp.ok || data.error || !data.success) {
            throw new Error(data.error || `Upload failed with status: ${resp.status}`);
        }
        initializeBook(data);
        if (fileInput && fileInput.files.length > 0 && fileInput.files[0] === fileToUpload) fileInput.value = '';
        if (addBookFileInput && addBookFileInput.files.length > 0 && addBookFileInput.files[0] === fileToUpload) addBookFileInput.value = '';
        if (offcanvasMenu && !offcanvasMenu.classList.contains('-translate-x-full')) {
            toggleMenu();
        }
    } catch (err) {
        showGlobalSpinner(false);
        showMessage('Upload error: ' + err.message);
        console.error('[processAndUploadFile] Error:', err);
    }
}

async function handleMainUploadForm(e) {
  e.preventDefault();
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    processAndUploadFile(fileInput.files[0]);
  } else {
    showMessage('Please select an EPUB file from the main form.');
  }
}

function initializeBook(data) {
  currentBook = {
    filename: data.filename,
    metadata: data.metadata,
    toc: data.toc,
    original_filename: data.original_filename || 'unknown.epub'
  };
  addToLibrary(currentBook.filename, currentBook.metadata.title, currentBook.original_filename);
  localStorage.setItem(lastOpenedBookKey, currentBook.filename);
  restoreBookState();
  chapterPrefix = (prefixInput ? prefixInput.value : '') || '';
  populateChapterDropdown();
  if (uploadSection) uploadSection.classList.add('hidden');
  if (readerSection) readerSection.classList.remove('hidden');
  if (currentBook.toc && currentBook.toc.length > 0) {
    if (currentChapterIndex >= currentBook.toc.length || currentChapterIndex < 0) {
        currentChapterIndex = 0;
    }
    if (chapterDropdown) chapterDropdown.value = currentChapterIndex;
    loadChapter(currentBook.toc[currentChapterIndex].id);
  } else {
    if (chapterTitle) chapterTitle.textContent = currentBook.original_filename || currentBook.metadata.title || "Book Loaded";
    if (chapterContent) {
        chapterContent.innerHTML = "<p class='text-gray-400'>This book appears to have no readable content or chapters in its Table of Contents.</p>";
    }
    updateCharacterCount(chapterContent ? chapterContent.textContent : ""); // Count placeholder or 0
    if (characterCount) characterCount.textContent = 'Chars: 0';
    if (chapterDropdown) chapterDropdown.innerHTML = '<option>No Chapters</option>';
    if (chunkIndicator) chunkIndicator.textContent = "";
    updateNavigationButtons();
    showMessage("Book has no chapters or Table of Contents is empty.");
  }
  renderUploadedList();
}

function loadLastOpenedBook() {
    const lastBookHashedFilename = localStorage.getItem(lastOpenedBookKey);
    if (lastBookHashedFilename) {
        const libraryList = JSON.parse(localStorage.getItem(uploadedListKey) || '[]');
        const bookInLibrary = libraryList.find(book => book.filename === lastBookHashedFilename);
        if (bookInLibrary) {
            loadBookFromLibrary(lastBookHashedFilename);
        } else {
            localStorage.removeItem(lastOpenedBookKey);
            resetReaderUI();
        }
    } else {
      resetReaderUI();
    }
}

document.addEventListener('DOMContentLoaded', () => {
  // Enforce dark mode (no theme switching)
  document.documentElement.classList.add('dark');
  document.documentElement.classList.remove('light'); // Just in case it was set by mistake

  updateHeadingsButtonsUI();

  if (menuToggleButton) menuToggleButton.addEventListener('click', toggleMenu);
  if (closeMenuButton) closeMenuButton.addEventListener('click', toggleMenu);

  if (uploadForm) uploadForm.addEventListener('submit', handleMainUploadForm);

  if (addBookFileInput) {
    addBookFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            processAndUploadFile(e.target.files[0]);
        }
    });
  }
  const addBookBtnLabel = document.getElementById('add-book-btn-label');
  if (addBookBtnLabel && addBookFileInput) {
      addBookBtnLabel.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              addBookFileInput.click();
          }
      });
  }

  if (chapterDropdown) chapterDropdown.addEventListener('change', handleChapterSelect);
  if (prevChapterBtn) prevChapterBtn.addEventListener('click', loadPreviousChapter);
  if (nextChapterBtn) nextChapterBtn.addEventListener('click', loadNextChapter);
  if (applyPrefixButton) applyPrefixButton.addEventListener('click', applyPrefix);
  if (copyButton) copyButton.addEventListener('click', copyRenderedContent);

  if (headingsOnBtn) headingsOnBtn.addEventListener('click', () => toggleHeadings(false));
  if (headingsOffBtn) headingsOffBtn.addEventListener('click', () => toggleHeadings(true));

  // --- START: Event listener for linesToRemoveInput ---
  if (linesToRemoveInput) {
    linesToRemoveInput.addEventListener('change', () => {
        const newValue = parseInt(linesToRemoveInput.value, 10);
        if (isNaN(newValue) || newValue < 0) {
            linesToRemoveInput.value = linesToRemoveAtStart; // Revert to old value if invalid
            return;
        }
        linesToRemoveAtStart = newValue;

        // Only reload chapter if "Headings OFF" is active and a chapter is loaded
        if (remove_headings && currentBook.filename && currentBook.toc && currentBook.toc[currentChapterIndex]) {
            clearSplit();
            loadChapter(currentBook.toc[currentChapterIndex].id);
        }
        saveBookState(); // Save the new number of lines to remove
    });
  }
  // --- END: Event listener for linesToRemoveInput ---

  if (splitButton) splitButton.addEventListener('click', splitChapterContent);
  if (clearSplitButton) clearSplitButton.addEventListener('click', () => {
    clearSplit();
    const contentToDisplay = chapterPrefix + originalChapterContent;
    renderParagraphs(contentToDisplay);
    //updateCharacterCount(contentToDisplay);
  });
  if (applyAllButton) applyAllButton.addEventListener('click', () => {
    applySplitToAll = !applySplitToAll;
    applyAllButton.classList.toggle('bg-blue-600', applySplitToAll); // Active state
    applyAllButton.classList.toggle('text-white', applySplitToAll);
    applyAllButton.classList.toggle('bg-gray-700', !applySplitToAll); // Inactive state
    applyAllButton.classList.toggle('text-gray-200', !applySplitToAll);
    applyAllButton.textContent = applySplitToAll ? 'Auto-Split: ON' : 'Auto-Split: OFF';
    applyAllButton.setAttribute('aria-pressed', applySplitToAll.toString());
    showMessage(applySplitToAll ? 'Auto-Split per chapter: ON' : 'Auto-Split per chapter: OFF');
    saveBookState();
  });
  if (prevChunkBtn) prevChunkBtn.addEventListener('click', () => changeChunk(-1));
  if (nextChunkBtn) nextChunkBtn.addEventListener('click', () => changeChunk(1));
  if (closeToast) closeToast.addEventListener('click', () => {
    if(messageBox) {
      messageBox.classList.add('opacity-0');
      setTimeout(() => messageBox.classList.add('hidden'), 300);
    }
  });
  // Removed themeSelector listener

  renderUploadedList();
  loadLastOpenedBook();

  if (offcanvasMenu) {
      let touchStartX = 0;
      offcanvasMenu.addEventListener('touchstart', (e) => {
        if (offcanvasMenu.contains(e.target)) {
            touchStartX = e.touches[0].clientX;
        }
      }, { passive: true });
      offcanvasMenu.addEventListener('touchend', (e) => {
        if (touchStartX === 0) return;
        const touchEndX = e.changedTouches[0].clientX;
        if (touchStartX - touchEndX > 70 && !offcanvasMenu.classList.contains('-translate-x-full')) {
          toggleMenu();
        }
        touchStartX = 0;
      });
  }
});