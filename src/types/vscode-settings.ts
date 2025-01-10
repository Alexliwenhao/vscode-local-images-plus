export interface Settings {
    attachmentFolder: string;
    jpegQuality: number;
    deduplicate: boolean;
    saveAttE: 'obsFolder' | 'inFolderBelow' | 'nextToNoteS';
    mediaRootDir: string;
    PngToJpeg: boolean;
    JpegQuality: number;
    useMarkdownLinks: boolean;
    useCaptions: boolean;
    pathInTags: 'fullDirPath' | 'onlyRelative' | 'baseFileName';
    filesizeLimit: number;
    downUnknown: boolean;
    showNotifications: boolean;
    removeOrphansCompl: boolean;
    processCreated: boolean;
    realTimeUpdate: boolean;
    realTimeUpdateInterval: number;
    dateFormat: string;
}

export const DEFAULT_SETTINGS: Settings = {
    attachmentFolder: 'assets',
    jpegQuality: 80,
    deduplicate: true,
    saveAttE: 'nextToNoteS',
    mediaRootDir: 'assets',
    PngToJpeg: false,
    JpegQuality: 80,
    useMarkdownLinks: false,
    useCaptions: true,
    pathInTags: 'onlyRelative',
    filesizeLimit: 0,
    downUnknown: false,
    showNotifications: true,
    removeOrphansCompl: false,
    processCreated: true,
    realTimeUpdate: true,
    realTimeUpdateInterval: 5,
    dateFormat: 'YYYY-MM-DD'
}; 