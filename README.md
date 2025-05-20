
## Requirements

*   PHP (version 7.4+ or 8.x recommended)
*   Web server (Apache, Nginx, or similar)
*   PHP Extensions:
    *   `zip` (for ZipArchive)
    *   `libxml` (for DOMDocument, SimpleXMLElement)
    *   `gd` (optional, but often enabled with PHP; included in Dockerfile)
    *   `mbstring` (recommended for unicode string handling)
*   Write permissions for the `uploads/` directory for the web server user.

## Installation & Setup

### 1. Manual Setup

1.  **Download:** Clone this repository or download the ZIP file.
    ```bash
    git clone https://github.com/s4daharu/EpubReaderPHP.git
    cd EpubReaderPHP
    ```
2.  **Web Server:** Place the files in a directory accessible by your web server (e.g., `htdocs`, `www`, `public_html`).
3.  **Permissions:** Ensure the web server has write permissions for the `uploads/` directory. If it doesn't exist, create it.
    ```bash
    mkdir uploads
    chmod -R 775 uploads
    # Adjust owner if necessary, e.g., chown -R www-data:www-data uploads
    ```
4.  **Access:** Open the application in your web browser (e.g., `http://localhost/EpubReaderPHP/`).

### 2. Docker Setup (Recommended for Easy Deployment)

A `Dockerfile` is provided for easy setup.

1.  **Prerequisites:** Ensure you have Docker installed.
2.  **Build the Image:** Navigate to the project's root directory (where the `Dockerfile` is) and run:
    ```bash
    docker build -t epub-reader-php .
    ```
3.  **Run the Container:**
    *   **Without persistent storage (uploads lost if container is removed):**
        ```bash
        docker run -d -p 8080:80 --name my-epub-reader epub-reader-php
        ```
    *   **With persistent storage using a named volume (recommended):**
        ```bash
        docker volume create epub-uploads-data
        docker run -d -p 8080:80 \
          --name my-epub-reader \
          -v epub-uploads-data:/var/www/html/uploads \
          epub-reader-php
        ```
    *   **With persistent storage using a bind mount (maps a host directory):**
        Create a directory on your host (e.g., `./local_uploads`) and then run:
        ```bash
        # For Linux/macOS:
        docker run -d -p 8080:80 \
          --name my-epub-reader \
          -v "$(pwd)/local_uploads":/var/www/html/uploads \
          epub-reader-php
        # For Windows (PowerShell, ensure local_uploads exists in current PWD):
        # docker run -d -p 8080:80 --name my-epub-reader -v "${PWD}/local_uploads":/var/www/html/uploads epub-reader-php
        ```
4.  **Access:** Open your web browser and go to `http://localhost:8080` (or the host port you mapped).

    **(Optional) PHP Configuration:** If you need to override PHP settings like `upload_max_filesize`, you can create a `custom-php.ini` file in the project root and uncomment the relevant line in the `Dockerfile` before building the image. Example `custom-php.ini`:
    ```ini
    upload_max_filesize = 50M
    post_max_size = 55M
    memory_limit = 256M
    ```

## Usage

1.  **Upload EPUB:** Use the "Upload EPUB" form or the "Add New Book" button in the side menu to select an EPUB file.
2.  **Read:** Once uploaded, the book will open.
    *   Use the chapter dropdown or "Prev/Next Chapter" buttons to navigate.
    *   The character count for the current full chapter is displayed.
3.  **Settings (Side Menu):**
    *   **Split by Characters:** Enter a number and click "Split" to divide the current chapter into chunks. Use "Prev/Next Chunk" to navigate. "Clear Split" reverts to the full chapter view. "Auto-Split" applies the split size to all chapters automatically as you navigate.
    *   **Optional Prefix:** Add text that will appear at the start of the displayed content.
    *   **Headings:** Toggle ON/OFF to show or hide headings (`<h1>-<h4>`) in the text.
    *   **Lines to remove at start:** If Headings are OFF, specify how many lines to trim from the beginning of the chapter text.
    *   **Your Library:** View all uploaded books. Click to open a book. Click the trash icon to delete a book.
4.  **Copy Content:** The "Copy" button copies the currently visible text (full chapter or current chunk) to your clipboard.

## Contributing

Contributions are welcome! If you have suggestions, bug reports, or want to contribute code:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix (`git checkout -b feature/your-feature-name` or `git checkout -b fix/issue-description`).
3.  **Make your changes.**
4.  **Test your changes thoroughly.**
5.  **Commit your changes** (`git commit -am 'Add some feature'`).
6.  **Push to the branch** (`git push origin feature/your-feature-name`).
7.  **Create a new Pull Request.**

Please try to follow the existing code style and add comments where necessary.

## License

This project is open-source. Please refer to the `LICENSE` file if one is added, otherwise assume it is free to use and modify (consider adding a standard open-source license like MIT or Apache 2.0).

*(If you don't have a LICENSE file, it's a good idea to add one. For example, you could create a `LICENSE` file and put the MIT License text in it.)*

---

Happy Reading!
