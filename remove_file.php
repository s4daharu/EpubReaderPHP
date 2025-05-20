<?php
// remove_file.php
header('Content-Type: application/json');

$uploadsDir = __DIR__ . '/uploads/';

// 1. Try to get filename from GET or POST
$filename = '';
if (!empty($_REQUEST['filename'])) {
    $filename = basename($_REQUEST['filename']);
} else {
    // 2. Fallback: try parsing JSON body
    $body = file_get_contents('php://input');
    if ($body) {
        $data = json_decode($body, true);
        if (!empty($data['filename'])) {
            $filename = basename($data['filename']);
        }
    }
}

// If still empty, bail out
if (!$filename) {
    echo json_encode(['error' => 'No filename specified']);
    exit;
}

// Strip extension to get the base hash
$base = pathinfo($filename, PATHINFO_FILENAME);

// Delete both the .json and .epub files for this book
$deleted = [];
foreach (['.json', '.epub'] as $ext) {
    $path = $uploadsDir . $base . $ext;
    if (file_exists($path)) {
        if (unlink($path)) {
            $deleted[] = $base . $ext;
        }
    }
}

// Return success (with optional info)
echo json_encode([
    'success'  => true,
    'deleted'  => $deleted
]);
?>
