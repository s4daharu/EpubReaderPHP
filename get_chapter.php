<?php
// get_chapter.php

header('Content-Type: application/json');

$uploadDir = __DIR__ . '/uploads/';

$filename = isset($_GET['filename']) ? basename($_GET['filename']) : '';
$chapterId = isset($_GET['chapter_id']) ? $_GET['chapter_id'] : '';
$removeHeadings = isset($_GET['remove_headings']) && strtolower($_GET['remove_headings']) === 'true';

// --- START: Get and validate lines_to_skip_at_start ---
$linesToSkipAtStart = 0; // Default
if ($removeHeadings && isset($_GET['lines_to_skip_at_start'])) {
    $potentialSkip = filter_var($_GET['lines_to_skip_at_start'], FILTER_VALIDATE_INT);
    if ($potentialSkip !== false && $potentialSkip >= 0) {
        $linesToSkipAtStart = $potentialSkip;
    }
}
// --- END: Get and validate lines_to_skip_at_start ---

if (!$filename || !$chapterId) {
    echo json_encode(['error' => 'Missing filename or chapter_id']);
    exit;
}

$filePath = $uploadDir . $filename;
if (!file_exists($filePath)) {
    echo json_encode(['error' => 'File not found']);
    exit;
}

$bookData = json_decode(file_get_contents($filePath), true);
if (!$bookData) {
    echo json_encode(['error' => 'Failed to load book data']);
    exit;
}

$chapter = null;
foreach ($bookData['chapters'] as $chap) {
    if ($chap['id'] === $chapterId) {
        $chapter = $chap;
        break;
    }
}

if (!$chapter) {
    echo json_encode(['error' => 'Chapter not found']);
    exit;
}

// Step 1: Convert HTML to text, potentially removing h1-h4 tags
$content = htmlToText($chapter['html_content'], $removeHeadings);

// --- START: Logic to remove leading lines ---
if ($removeHeadings && $linesToSkipAtStart > 0 && !empty($content)) {
    $lines = explode("\n", $content);
    if (count($lines) > $linesToSkipAtStart) {
        // Slice the array, starting from the index $linesToSkipAtStart
        $lines = array_slice($lines, $linesToSkipAtStart);
        $content = implode("\n", $lines);
    } else {
        // If attempting to skip more lines than exist, or exactly all lines, result in empty content
        $content = "";
    }
}
// --- END: Logic to remove leading lines ---

echo json_encode([
    'success' => true,
    'chapter' => [
        'id' => $chapter['id'],
        'title' => $chapter['title'],
        'content' => $content // This is now the fully processed content
    ],
    'original_filename' => $bookData['original_filename'] ?? 'unknown.epub'
]);
exit;

function htmlToText($html, $removeHeadings = false) {
    libxml_use_internal_errors(true);
    $doc = new DOMDocument();
    @$doc->loadHTML('<?xml encoding="utf-8" ?>' . $html);

    if ($removeHeadings) {
        foreach (['h1', 'h2', 'h3', 'h4'] as $tag) {
            $elements = $doc->getElementsByTagName($tag);
            while ($elements->length > 0) {
                $elements->item(0)->parentNode->removeChild($elements->item(0));
            }
        }
    }

    foreach (['p', 'div', 'li', 'blockquote', 'tr'] as $tag) {
        $elements = $doc->getElementsByTagName($tag);
        foreach ($elements as $element) {
            $element->appendChild($doc->createTextNode("\n")); // Single newline after these blocks
        }
    }
    if (!$removeHeadings) {
        foreach (['h1', 'h2', 'h3', 'h4'] as $tag) {
            $elements = $doc->getElementsByTagName($tag);
            foreach ($elements as $element) {
                // Add newline before and after headings if they are kept
                $element->insertBefore($doc->createTextNode("\n\n"), $element->firstChild); // Double before
                $element->appendChild($doc->createTextNode("\n")); // Single after
            }
        }
    }
    $elements = $doc->getElementsByTagName('br');
    foreach ($elements as $br) {
        $br->parentNode->replaceChild($doc->createTextNode("\n"), $br);
    }

    $text = $doc->textContent;
    // Normalize multiple newlines created by block elements and br tags
    $text = preg_replace("/\n\s*\n/", "\n\n", $text); // Consolidate multiple newlines into double newlines

    $lines = explode("\n", $text);
    $result = [];
    foreach ($lines as $line) {
        $stripped = trim($line); // Trim each line
        // To avoid many empty lines from just whitespace, only add if not purely whitespace after trim
        // Or, if you want to preserve some empty lines that were intentional (e.g. after trim it's empty string)
        // For now, this will collapse multiple "empty" lines.
        $result[] = $stripped;
    }
    // Re-join then re-split by double newlines to better form paragraphs,
    // then trim individual paragraphs.
    // This part might be too aggressive if precise line count matters.
    // Let's stick to the simpler approach above.
    // The key change is that `trim($line)` happens *before* counting lines for removal.

    return implode("\n", $result); // Return lines separated by single newlines.
}
