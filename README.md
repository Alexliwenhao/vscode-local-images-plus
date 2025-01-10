# VSCode Local Images Plus

Version: 1.0.0

A VSCode extension that downloads media files from external links and saves them locally.

## Features

- Downloads media files from copied/pasted content of web pages
- Localizes media files from copied/pasted content of word / Open Office documents
- Saves attachments in assets folder next to the document
- Downloads files embedded in markdown tags from web
- Saves base64 embedded images
- Converts PNG images to JPEG images with various quality
- Attachments de-duplication using MD5 hashing algorithm
- Removes orphaned attachments

## Settings

This extension contributes the following settings:

* `localImagesPlus.attachmentFolder`: Attachment folder name (default: "assets")
* `localImagesPlus.jpegQuality`: JPEG conversion quality (1-100)
* `localImagesPlus.deduplicate`: Enable file deduplication using MD5
* `localImagesPlus.saveAttE`: Where to save attachments
* `localImagesPlus.mediaRootDir`: Media root directory pattern
* ... (其他设置)

## Usage

1. Open a markdown file
2. Copy an image from web or file system
3. Press Ctrl+Alt+V (Cmd+Alt+V on Mac) to paste and save locally
4. The image will be saved in the assets folder and referenced in markdown

## Commands

* `Local Images Plus: Download Media from Clipboard`
* `Local Images Plus: Convert Images to PNG`
* `Local Images Plus: Clean Orphaned Attachments`

## Changelog

### 1.0.0
- Initial release
- Support for downloading and localizing images
- Support for converting PNG to JPEG
- Support for cleaning orphaned files
- Customizable settings for file organization
