<!DOCTYPE html>
<html lang="en" class="dark"> <!-- Enforce dark mode on HTML tag -->
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>EPUB Reader</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet">
  <link href="static/css/custom.css" rel="stylesheet">
</head>
<body class="bg-gray-900 text-white"> <!-- Enforce dark mode body styles -->
  <div class="container mx-auto p-3 max-w-lg">
    <header class="flex justify-between items-center mb-3">
      <button
        id="menu-toggle"
        class="bg-gray-800 bg-opacity-50 border border-white text-white px-3 py-1 rounded hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Open menu"
        aria-controls="offcanvasMenu"
        aria-expanded="false"
      >
        <i class="fas fa-bars fa-lg"></i>
      </button>
      <h1 class="flex-1 text-center text-xl font-semibold">EPUB Reader</h1>
      <div class="w-10"></div>
    </header>

    <div
      id="offcanvasMenu"
      class="fixed inset-y-0 left-0 bg-gray-800 transform -translate-x-full transition-transform duration-300 ease-in-out z-50 overflow-y-auto shadow-xl"
      role="dialog" aria-modal="true" aria-labelledby="offcanvasMenuTitle"
      aria-hidden="true"
    >
      <div class="p-4">
        <div class="flex justify-between items-center mb-4">
          <h5 id="offcanvasMenuTitle" class="text-lg font-semibold">Settings & Library</h5>
          <button
            id="close-menu"
            class="text-gray-300 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Close menu"
          >
            <i class="fas fa-times fa-lg"></i>
          </button>
        </div>

        <div class="mb-4">
          <label
            for="add-book-file-input"
            id="add-book-btn-label"
            class="w-full cursor-pointer bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-4 py-2.5 rounded focus-within:outline-none focus-within:ring-2 focus-within:ring-green-400 font-medium text-sm flex items-center justify-center"
            tabindex="0"
          >
            <i class="fas fa-plus-circle mr-2"></i>Add New Book
          </label>
          <input type="file" id="add-book-file-input" class="hidden" accept=".epub" />
        </div>
        <hr class="my-4 border-gray-700">

        <div class="mb-4">
          <label for="split-count" class="block mb-1 text-sm font-medium text-gray-300">Split by Characters</label>
          <div class="flex space-x-2">
            <input
              type="number"
              id="split-count"
              class="flex-1 px-3 py-2 border border-gray-600 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g. 2000"
            >
            <button
              id="split-button"
              class="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium"
            >
              Split
            </button>
          </div>
          <div class="mt-2 flex justify-between items-center">
            <button
              id="clear-split"
              class="bg-gray-600 text-gray-200 px-3 py-1 rounded hover:bg-gray-500 hidden text-xs"
            >
              Clear Split
            </button>
            <button
              id="apply-all"
              class="bg-gray-700 text-gray-200 px-3 py-1 rounded hover:bg-gray-600 text-xs"
              aria-pressed="false"
            >
              Auto-Split: OFF
            </button>
          </div>
        </div>

        <div class="mb-4">
          <label for="prefix-input" class="block mb-1 text-sm font-medium text-gray-300">Optional Prefix</label>
          <div class="flex space-x-2">
            <input
              type="text"
              id="prefix-input"
              class="flex-1 px-3 py-2 border border-gray-600 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Add prefix"
            >
            <button
              id="apply-prefix"
              class="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium"
            >
              Apply
            </button>
          </div>
        </div>

        <div class="mb-4">
          <p class="mb-1 text-sm font-medium text-gray-300">Headings:</p>
          <div class="flex space-x-2">
            <button
              id="headings-on"
              class="flex-1 px-3 py-1.5 rounded focus:outline-none text-sm font-medium"
              aria-pressed="true"
            >
              ON
            </button>
            <button
              id="headings-off"
              class="flex-1 px-3 py-1.5 rounded focus:outline-none text-sm font-medium"
              aria-pressed="false"
            >
              OFF
            </button>
          </div>
        </div>
         <!-- START: Lines to remove at start (NEW SECTION) -->
        <div id="lines-to-remove-section" class="mt-3 mb-4 hidden"> <!-- Initially hidden -->
            <label for="lines-to-remove-input" class="block mb-1 text-sm font-medium text-gray-300">Lines to remove at start (if Headings OFF):</label>
            <input
              type="number"
              id="lines-to-remove-input"
              min="0"
              class="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g. 3"
              value="0"
            >
        </div>

        <hr class="my-4 border-gray-700">

        <div class="mb-4">
          <p class="mb-2 font-semibold text-gray-200">Your Library:</p>
          <div
            id="uploaded-books"
            class="max-h-60 overflow-y-auto border border-gray-700 rounded p-1 bg-gray-700/30"
          >
            <!-- Injected by main.js -->
          </div>
        </div>
      </div>
    </div>

    <div id="upload-section" class="mb-4">
      <h2 class="text-xl mb-3 font-semibold text-gray-200">Upload EPUB</h2>
      <form id="upload-form" class="mb-3 p-4 bg-gray-800 rounded-lg shadow">
        <div class="mb-3">
          <label for="epub-file" class="sr-only">Choose EPUB file</label>
          <input
            class="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
            type="file"
            id="epub-file"
            name="file"
            accept=".epub"
          >
        </div>
        <button
          type="submit"
          id="upload-button"
          class="w-full bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-green-400 font-medium text-sm"
        >
          <i class="fas fa-upload mr-2"></i>Upload & Read
        </button>
      </form>
    </div>

    <!-- Reader Section -->
    <div id="reader-section" class="hidden">
      <!-- Row for Chapter Dropdown and Character Count -->
      <div class="flex justify-between items-center mb-2 p-2 bg-gray-800 rounded-lg shadow">
        <div class="w-3/4 mr-2">
          <label for="chapter-dropdown" class="sr-only">Select Chapter</label>
          <select
            id="chapter-dropdown"
            class="w-full px-3 py-2 border border-gray-600 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          ></select>
        </div>
        <p id="character-count" class="text-xs text-gray-400 whitespace-nowrap">Chars: 0</p>
      </div>

      <!-- Row for Chapter Title and Chunk Indicator -->
      <div class="flex justify-between items-center mb-2 p-3 bg-gray-800 rounded-lg shadow">
          <h3 id="chapter-title" class="text-lg font-semibold truncate mr-2"></h3>
          <span id="chunk-indicator" class="text-xs text-gray-400 whitespace-nowrap"></span>
      </div>

      <!-- Chapter Content Area -->
      <div
        id="chapter-content"
        class="p-4 bg-gray-800 overflow-auto text-gray-300 whitespace-pre-line [&>p]:mb-3 text-base leading-relaxed shadow"
        style="max-height: calc(100vh - 22rem);"
      ></div>

      <!-- Chunk Navigation and Copy Button -->
      <div
        id="chunk-navigation"
        class="p-3 bg-gray-800 border-t border-gray-700 flex justify-between items-center rounded-b-lg shadow mt-2"
      >
        <button
          id="prev-chunk"
          class="bg-gray-600 text-gray-200 px-4 py-2 rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium disabled:opacity-50"
          disabled
        >
          Prev
        </button>
        <button
            id="copy-button"
            class="bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm font-medium"
          >
            <i class="fas fa-copy mr-1"></i> Copy
        </button>
        <button
          id="next-chunk"
          class="bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-400 text-sm font-medium disabled:opacity-50"
          disabled
        >
          Next
        </button>
      </div>

      <!-- Main Chapter Navigation -->
      <div class="flex space-x-2 mt-3">
        <button
          id="prev-chapter"
          class="flex-1 bg-gray-700 text-gray-200 px-4 py-2.5 rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium disabled:opacity-50"
          disabled
        >
          <i class="fas fa-chevron-left mr-1"></i> Prev
        </button>
        <button
          id="next-chapter"
          class="flex-1 bg-green-600 hover:bg-green-700 focus:bg-green-700 text-white px-4 py-2.5 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 font-medium disabled:opacity-50"
          disabled
        >
          Next <i class="fas fa-chevron-right ml-1"></i>
        </button>
      </div>
    </div>

    <div
      id="message-box"
      class="fixed top-4 right-4 max-w-xs bg-gray-800 text-white rounded-lg p-3 shadow-lg hidden opacity-0 transition-opacity duration-300 ease-in-out z-[9999]"
      role="status" aria-live="polite"
    >
      <div class="flex justify-between items-center">
        <span id="message-text" class="text-sm"></span>
        <button
          id="close-toast"
          class="ml-2 text-gray-300 hover:text-white focus:outline-none"
          aria-label="Close message"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
  <script src="static/js/main.js"></script>
</body>
</html>