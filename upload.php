<?php
// upload.php
error_reporting(E_ALL);
ini_set('display_errors', 1); // Set to 0 in production
header('Content-Type: application/json');

$uploadDir = __DIR__ . '/uploads/';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        echo json_encode(['error' => 'Failed to create uploads directory. Check permissions.']);
        exit;
    }
}

// --- START: Handle GET request to load existing book data ---
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['load_book'])) {
    $requestedJsonFilename = basename($_GET['load_book']); // This is {hash}.json
    $filePath = $uploadDir . $requestedJsonFilename;

    if (substr($requestedJsonFilename, -5) === '.json' && file_exists($filePath)) {
        $bookDataJson = file_get_contents($filePath);
        $bookData = json_decode($bookDataJson, true);

        if ($bookData && isset($bookData['metadata']) && isset($bookData['toc'])) {
            echo json_encode([
                'success'           => true,
                'filename'          => $requestedJsonFilename, // The {hash}.json filename
                'metadata'          => $bookData['metadata'],
                'toc'               => $bookData['toc'],
                'original_filename' => $bookData['original_filename'] ?? 'unknown.epub'
            ]);
            exit;
        } else {
            echo json_encode(['error' => 'Book data not found or invalid in cached file.']);
            exit;
        }
    } else {
        echo json_encode(['error' => 'Specified book file not found.']);
        exit;
    }
}
// --- END: Handle GET request ---

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Invalid request method. Only POST and GET (for load_book) are allowed.']);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE   => 'The uploaded file exceeds the upload_max_filesize directive in php.ini.',
        UPLOAD_ERR_FORM_SIZE  => 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form.',
        UPLOAD_ERR_PARTIAL    => 'The uploaded file was only partially uploaded.',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder.',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk.',
        UPLOAD_ERR_EXTENSION  => 'A PHP extension stopped the file upload.',
    ];
    $errorCode = $_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE;
    $errorMessage = $uploadErrors[$errorCode] ?? 'Unknown upload error.';
    echo json_encode(['error' => 'Upload Error: ' . $errorMessage]);
    exit;
}

$file = $_FILES['file'];
$originalUploadedFilename = basename($file['name']);

if (strtolower(pathinfo($originalUploadedFilename, PATHINFO_EXTENSION)) !== 'epub') {
    echo json_encode(['error' => 'Invalid file format. Please upload an EPUB file.']);
    exit;
}

// Compute SHA-1 hash of uploaded file content
$hash = sha1_file($file['tmp_name']);
if ($hash === false) {
    echo json_encode(['error' => 'Failed to compute hash of the uploaded file.']);
    exit;
}

$jsonFilename = $hash . '.json';
$epubFilename = $hash . '.epub'; // Store the original EPUB under its hash name
$jsonFilePath  = $uploadDir . $jsonFilename;
$epubFilePath  = $uploadDir . $epubFilename;

// If JSON already exists, return existing data
if (file_exists($jsonFilePath)) {
    $bookDataJson = file_get_contents($jsonFilePath);
    $bookData = json_decode($bookDataJson, true);

    if ($bookData && isset($bookData['metadata']) && isset($bookData['toc'])) {
        $finalOriginalFilename = $bookData['original_filename'] ?? $originalUploadedFilename;
        // If original_filename was missing in an old cache, update it (optional, good for consistency)
        if (!isset($bookData['original_filename'])) {
            $bookData['original_filename'] = $originalUploadedFilename;
            file_put_contents($jsonFilePath, json_encode($bookData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        }
        echo json_encode([
            'success'           => true,
            'filename'          => $jsonFilename, // The {hash}.json filename
            'metadata'          => $bookData['metadata'],
            'toc'               => $bookData['toc'],
            'original_filename' => $finalOriginalFilename
        ]);
        exit; // Exit after serving cached data
    } else {
        // Cached JSON is corrupted or incomplete. Delete it to allow reprocessing.
        if(file_exists($jsonFilePath)) {
            unlink($jsonFilePath);
        }
        // If JSON was corrupt, the corresponding EPUB might also be, or might be fine.
        // For simplicity, we'll re-save the EPUB if it doesn't exist or overwrite if it was part of the corruption.
        // This means a re-upload of the same content after JSON corruption will fix it.
    }
}

// Move the uploaded EPUB into place (as {hash}.epub)
// This also handles the case where JSON was corrupt but EPUB was fine (it won't re-move if $epubFilePath exists)
// Or if this is a fresh upload.
if (!file_exists($epubFilePath)) {
    if (!move_uploaded_file($file['tmp_name'], $epubFilePath)) {
        echo json_encode(['error' => 'Failed to save uploaded EPUB file. Check server permissions for uploads/ directory.']);
        exit;
    }
} else {
    // EPUB file with this hash already exists.
    // We can use the existing $epubFilePath. $file['tmp_name'] might have been cleaned up already if this is a quick re-upload.
}


// Open EPUB as ZIP (using the path to the stored {hash}.epub)
$zip = new ZipArchive();
if ($zip->open($epubFilePath) !== TRUE) {
    echo json_encode(['error' => 'Failed to open EPUB file. It might be corrupted or not a valid ZIP archive.']);
    exit;
}

// Read container.xml to locate OPF
$containerXmlContent = $zip->getFromName('META-INF/container.xml');
if ($containerXmlContent === false) {
    echo json_encode(['error' => 'Invalid EPUB: missing META-INF/container.xml.']);
    $zip->close();
    exit;
}
$container = new SimpleXMLElement($containerXmlContent);
if (!isset($container->rootfiles->rootfile['full-path'])) {
    echo json_encode(['error' => 'Invalid EPUB: Could not find full-path in container.xml.']);
    $zip->close();
    exit;
}
$opfPath   = (string)$container->rootfiles->rootfile['full-path'];
$opfXmlContent    = $zip->getFromName($opfPath);
if ($opfXmlContent === false) {
    echo json_encode(['error' => 'Invalid EPUB: missing content OPF file specified in container.xml at ' . htmlspecialchars($opfPath) . '.']);
    $zip->close();
    exit;
}

// Parse metadata
$opf = new SimpleXMLElement($opfXmlContent);
$ns  = $opf->getNamespaces(true); // Get all namespaces
$dcNamespace = $ns['dc'] ?? 'http://purl.org/dc/elements/1.1/'; // Default to common DC namespace
$opf->registerXPathNamespace('dc', $dcNamespace);
// For other namespaces like 'opf', you might need to register them if querying specific OPF elements.
// $opf->registerXPathNamespace('opf', $ns['opf'] ?? 'http://www.idpf.org/2007/opf');

$metadata = [
    'title'    => (string)($opf->xpath('//dc:title')[0] ?? 'Unknown Title'),
    'creator'  => (string)($opf->xpath('//dc:creator')[0] ?? 'Unknown Author'),
    'language' => (string)($opf->xpath('//dc:language')[0] ?? 'N/A')
];

// Build manifest of XHTML/html items
$manifest = [];
$opfDir = dirname($opfPath); // Directory of the OPF file, relative to EPUB root

foreach ($opf->manifest->item as $item) {
    $id        = (string)$item['id'];
    $href      = (string)$item['href'];
    $mediaType = (string)$item['media-type'];
    if (in_array($mediaType, ['application/xhtml+xml', 'text/html'])) {
        // Resolve href relative to OPF file path
        if ($opfDir !== '.' && $opfDir !== '') {
            $manifest[$id] = $opfDir . '/' . $href;
        } else {
            $manifest[$id] = $href;
        }
        // Normalize path (e.g., convert .. segments if any, though less common in manifest hrefs)
        // $manifest[$id] = realpath($manifest[$id]); // realpath doesn't work well with zip streams
        // Basic normalization:
        $pathParts = explode('/', $manifest[$id]);
        $normalizedParts = [];
        foreach ($pathParts as $part) {
            if ($part === '..') {
                array_pop($normalizedParts);
            } elseif ($part !== '.') {
                $normalizedParts[] = $part;
            }
        }
        $manifest[$id] = implode('/', $normalizedParts);
    }
}

// Extract chapters and TOC based on spine
$chapters = [];
$toc      = [];
$chapterOrder = 0;

if ($opf->spine) {
    foreach ($opf->spine->itemref as $itemref) {
        $idref = (string)$itemref['idref'];
        if (!isset($manifest[$idref])) {
            continue; // Item in spine not found in manifest or not XHTML/HTML
        }

        $chapterFilePathInZip = $manifest[$idref];
        $content  = $zip->getFromName($chapterFilePathInZip);

        if ($content === false) { // Could not read content from zip
            continue;
        }

        // Derive a title from the first <h1–h4>, or default
        $title = "Chapter " . ($chapterOrder + 1);
        if (preg_match('/<h[1-4][^>]*>(.*?)<\/h[1-4]>/is', $content, $matches)) {
            $extractedTitle = trim(strip_tags($matches[1]));
            if (!empty($extractedTitle)) {
                 $title = $extractedTitle;
            }
        }

        $chapters[] = [
            'id'           => $idref, // Use manifest ID as chapter ID
            'title'        => $title,
            'html_content' => $content // Store raw HTML content from EPUB
        ];
        $toc[] = ['id' => $idref, 'title' => $title];
        $chapterOrder++;
    }
}

$zip->close();

if (empty($chapters)) {
    // Fallback if spine processing yielded no chapters (e.g. malformed EPUB)
    // We could try to iterate manifest items if spine is empty/problematic
    // but for now, we'll report an error if no chapters found via spine.
    if (empty($manifest)){
      echo json_encode(['error' => 'No HTML/XHTML items found in the EPUB manifest.']);
      exit;
    }
    // If manifest had items but spine didn't link them, or yielded no content
    // This indicates a structural issue with the EPUB or parsing.
}


// Assemble and write JSON
$bookData = [
    'metadata'          => $metadata,
    'chapters'          => $chapters, // Actual chapter content
    'toc'               => $toc,      // Table of Contents (id, title pairs)
    'original_filename' => $originalUploadedFilename // The original name of the uploaded .epub file
];

if (!file_put_contents($jsonFilePath, json_encode($bookData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    echo json_encode(['error' => 'Failed to save processed book data. Check server permissions for uploads/ directory.']);
    exit;
}

// Return response for newly processed book
echo json_encode([
    'success'           => true,
    'filename'          => $jsonFilename,         // The {hash}.json filename
    'metadata'          => $metadata,             // Directly from parsed data
    'toc'               => $toc,                  // Directly from parsed data
    'original_filename' => $originalUploadedFilename // The original uploaded filename
]);
?>