const FileUtils = {
    getFileExtension: (fileName) => fileName.split('.').pop().toLowerCase() || "",
    
	getFileContentType: (fileName) => {
	    const mimeTypes = {
	        // Text formats
	        'txt': 'text/plain',
	        'csv': 'text/csv',
	        'tsv': 'text/tab-separated-values',
	        'xml': 'application/xml',
	        'xsd': 'application/xml-schema',
	
	        // Document formats
	        'pdf': 'application/pdf',
	        'doc': 'application/msword',
	        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	        'odt': 'application/vnd.oasis.opendocument.text',
	        'rtf': 'application/rtf',
	
	        // Spreadsheet formats
	        'xls': 'application/vnd.ms-excel',
	        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	        'ods': 'application/vnd.oasis.opendocument.spreadsheet',
	
	        // Presentation formats
	        'ppt': 'application/vnd.ms-powerpoint',
	        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	
	        // Geographic and CAD formats
	        'shp': 'application/x-shapefile',
	        'dwg': 'application/acad',
	        'dxf': 'application/dxf',
	        'gds': 'application/x-gds',
	        'gef': 'application/x-gef',
	        'svg': 'image/svg+xml',
	        'stg': 'application/vnd.sla',
	
	        // Web development formats
	        'html': 'text/html',
	        'htm': 'text/html',
	        'css': 'text/css',
	        'js': 'application/javascript',
	        'json': 'application/json',
	
	        // Image formats
	        'jpg': 'image/jpeg',
	        'jpeg': 'image/jpeg',
	        'png': 'image/png',
	        'gif': 'image/gif',
	        'bmp': 'image/bmp',
	        'tiff': 'image/tiff',
	        'ico': 'image/vnd.microsoft.icon',
	        'webp': 'image/webp',
	
	        // Audio formats
	        'mp3': 'audio/mpeg',
	        'wav': 'audio/wav',
	        'ogg': 'audio/ogg',
	        'flac': 'audio/flac',
	
	        // Video formats
	        'mp4': 'video/mp4',
	        'mkv': 'video/x-matroska',
	        'mov': 'video/quicktime',
	        'avi': 'video/x-msvideo',
	        'webm': 'video/webm',
	
	        // Archive formats
	        'zip': 'application/zip',
	        'rar': 'application/x-rar-compressed',
	        '7z': 'application/x-7z-compressed',
	        'tar': 'application/x-tar',
	        'gz': 'application/gzip',
	
	        // Miscellaneous formats
	        'ics': 'text/calendar',
	        'vcf': 'text/x-vcard',
	        'md': 'text/markdown',
	    };
	
	    return mimeTypes[FileUtils.getFileExtension(fileName)] || 'application/octet-stream';
	},

    readAsArrayBuffer: (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    }),

    isZipFileBySignature: async (file) => {
        const zipSignature = [0x50, 0x4B, 0x03, 0x04];
        const content = await FileUtils.readAsArrayBuffer(file);
        const buffer = new Uint8Array(content);
        return zipSignature.every((byte, i) => buffer[i] === byte);
    },
};
const PackageUtils = {
    knownExtensions: ['gz', 'kmz', 'ti', 'tar', 'tar.gz', 'zip'],

    isPackage: async (file) => {
        if (PackageUtils.knownExtensions.includes(FileUtils.getFileExtension(file.name))) {
            return true;
        }
        return FileUtils.isZipFileBySignature(file);
    },

    // processZipFile: async (file) => req(["jszip"], (JSZip) => {
    // 	return FileUtils.readAsArrayBuffer(file)
    // 		.then(buffer => new JSZip().loadAsync(buffer))
    // 		.then(zip => Object.entries(zip.files).map(([name, zipEntry]) => ({
	   //         name,
	   //         isFile: !zipEntry.dir,
	   //         isPackage: PackageUtils.knownExtensions.includes(FileUtils.getFileExtension(name)),
	   //         size: zipEntry._data.uncompressedSize,
	   //         getContent: () => zipEntry.async('arraybuffer'),
	   //     })));
    // },
	
	processZipFile: (file) => {
	    return new Promise((resolve, reject) => {
	        require(["jszip"], (JSZip) => {
	            file.getContent()
	            	.then(buffer => new JSZip().loadAsync(buffer))
	                .then(zip => {
	                    const entries = Object.entries(zip.files).map(([name, zipEntry]) => ({
	                        name,
	                        isFile: !zipEntry.dir,
	                        isPackage: PackageUtils.knownExtensions.includes(FileUtils.getFileExtension(name)),
	                        size: zipEntry._data.uncompressedSize,
	                        getContent: () => zipEntry.async('arraybuffer'),
	                    }));
	                    resolve(entries);
	                })
	                .catch(reject);
	        }, reject);
	    });
	},

    processPackageFile: async (file) => {
        if (await PackageUtils.isPackage(file)) {
            return PackageUtils.processZipFile(file);
        }
        throw new Error("Unsupported package type");
    },
};
const TreeUtils = {
    createNode: (name, isFile = false) => ({
        name,
        isFile,
        files: [],
        directories: [],
    }),

    addFileToNode: (node, file, r) => {
        node.files.push(r = {
            name: file.name,
            size: file.size,
            contentType: FileUtils.getFileContentType(file.name),
            isPackage: PackageUtils.knownExtensions.includes(FileUtils.getFileExtension(file.name)),
            getContent: () => FileUtils.readAsArrayBuffer(file),
        });
        return r;
    },

    findNodeByPath: (path, rootNode) => {
        const parts = path.split('/').filter(Boolean);
        return parts.reduce((currentNode, part) => {
            if (!currentNode) return null;
            return currentNode.directories.find(dir => dir.name === part) || null;
        }, rootNode);
    },
};

// API definition
define(function(require) {
    const rootNode = TreeUtils.createNode("root");

	const findFileByPath = async (path, currentNode = rootNode, opts = { recursePackages: true }) => {
	    const parts = path.split('/').filter(Boolean); // Split and clean up the path
	    let node = currentNode;
	
	    for (let i = 0; i < parts.length - 1; i++) {
	        const dirName = parts[i];
	        const dir = node.directories.find(d => d.name === dirName);
	
	        if (!dir) {
	            const file = node.files.find(f => f.name === dirName);
	
	            // If it's a package file, process it if the option is enabled
	            if (file && opts.recursePackages && await PackageUtils.isPackage(file)) {
	                const entries = await PackageUtils.processPackageFile(file);
	                const packageNode = {
	                    name: file.name,
	                    directories: entries.filter(e => !e.isFile),
	                    files: entries.filter(e => e.isFile),
	                };
	
	                // Recursively call findFileByPath for the rest of the path
	                return findFileByPath(parts.slice(i + 1).join('/'), packageNode, opts);
	            }
	
	            return null; // Path not found
	        }
	
	        node = dir;
	    }
	
	    // Look for the file in the last part of the path
	    const fileName = parts[parts.length - 1];
	    const fileNode = node.files.find(f => f.name === fileName);
	    return fileNode || null; // Return the file node or null if not found
	};

    const handleFileDrop = async (event) => {
        event.preventDefault();
        const promises = Array.from(event.dataTransfer.items)
            .map(item => item.webkitGetAsEntry())
            .filter(Boolean)
            .map(entry => traverseEntry(entry, rootNode));
        return await Promise.all(promises);
    };

    const handleInputChange = async (event) => {
        const files = event.target.files;
        const promises = Array.from(files).map(file => traverseFile(file, rootNode));
        return await Promise.all(promises);
    };

	const traverseEntry = async (entry, directoryNode) => {
	    if (entry.isFile) {
	        const file = await getFileFromEntry(entry);
	        const fileNode = TreeUtils.addFileToNode(directoryNode, file);
	        return fileNode; // Return the file node for the caller
	    } 
	    
        const dirNode = TreeUtils.createNode(entry.name);
        directoryNode.directories.push(dirNode);
        const reader = entry.createReader();
        const entries = await readAllEntries(reader);
        await Promise.all(entries.map(e => traverseEntry(e, dirNode)));
        return dirNode; // Return the directory node for the caller
	};

	const traverseFile = async (file, directoryNode) => {
	    const path = file.webkitRelativePath || file.name;
	    const parts = path.split('/');
	    let currentDir = directoryNode;
	
	    parts.slice(0, -1).forEach(part => {
	        let dir = currentDir.directories.find(d => d.name === part);
	        if (!dir) {
	            dir = TreeUtils.createNode(part);
	            currentDir.directories.push(dir);
	        }
	        currentDir = dir;
	    });
	
	    const fileNode = TreeUtils.addFileToNode(currentDir, file);
	    return fileNode; // Return the final file node
	};

    const getFileFromEntry = (entry) =>
        new Promise((resolve, reject) => entry.file(resolve, reject));

    const readAllEntries = (reader) =>
        new Promise((resolve, reject) => {
            const entries = [];
            const readBatch = () => {
                reader.readEntries(batch => {
                    if (batch.length) {
                        entries.push(...batch);
                        readBatch();
                    } else {
                        resolve(entries);
                    }
                }, reject);
            };
            readBatch();
        });

	const listFiles = async function(path, opts = { recursive: false, recursePackages: false }) {
	    const dirNode = TreeUtils.findNodeByPath(path, rootNode);
	
	    if (!dirNode) {
	        // If no directory is found, check for a package (e.g., ZIP file)
	        const packageNode = await findFileByPath(path);
	        if (!packageNode || !(await PackageUtils.isPackage(packageNode))) {
	            return { error: "Path not found" };
	        }
	
	        // Process the package and return its contents
	        const entries = await PackageUtils.processPackageFile(packageNode);
	        return entries.map(entry => ({
	            name: entry.name, path,
	            type: entry.isPackage ? "Package" : entry.isFile ? "File" : "Folder",
	            size: entry.size || 0, 
	            uri: `${path}/${entry.name}`,
	            contentType: entry.contentType || FileUtils.getFileContentType(entry.name)
	        }));
	    }
	
	    // Helper function to flatten directories and packages
	    const flattenDirectoryRecursively = async (node, currentPath) => {
	        let result = [];
	
	        // Process directories
	        for (const dir of node.directories) {
	            const dirPath = `${currentPath}/${dir.name}`;
	            result.push({
	                uri: dirPath,
	                name: dir.name,
	                path: currentPath,
	                type: "Folder"
	            });
	
	            // Recursively process the contents of the directory
	            const subdirResult = await flattenDirectoryRecursively(dir, dirPath);
	            result = result.concat(subdirResult);
	        }
	
	        // Process files and check for packages
	        for (const file of node.files) {
	            const filePath = `${currentPath}/${file.name}`;
	
	            if (opts.recursePackages && await PackageUtils.isPackage(file)) {
	                // Treat package as a folder and list its contents
	                const packageEntries = await PackageUtils.processPackageFile(file);
	                for (const entry of packageEntries) {
	                    const packagePath = `${filePath}/${entry.name}`;
	                    result.push({
	                        uri: packagePath,
	                        name: entry.name,
	                        path: filePath,
	                        type: entry.isPackage ? "Package" : entry.isFile ? "File" : "Folder",
	                        size: entry.size || 0,
	                        contentType: entry.contentType || FileUtils.getFileContentType(entry.name)
	                    });
	
	                    // Recurse for nested entries if recursive option is enabled
	                    if (opts.recursive && entry.isDirectory) {
	                        const packageSubdirResult = await flattenDirectoryRecursively(entry, packagePath);
	                        result = result.concat(packageSubdirResult);
	                    }
	                }
	            } else {
	                // Regular file processing
	                result.push({
	                    uri: filePath,
	                    name: file.name,
	                    path: currentPath,
	                    type: file.isPackage ? "Package" : "File",
	                    size: file.size,
	                    contentType: file.type || FileUtils.getFileContentType(file.name)
	                });
	            }
	        }
	
	        return result;
	    };
	
	    // If recursive option is enabled, recursively list the directory structure
	    if (opts.recursive) {
	        return flattenDirectoryRecursively(dirNode, path);
	    }
	
	    // Otherwise, return one level of directories and files
	    const items = [
	        ...dirNode.directories.map(dir => ({
	            uri: `${path}/${dir.name}`,
	            name: dir.name,
	            path: path,
	            type: "Folder"
	        })),
	        ...dirNode.files.map(file => ({
	            uri: `${path}/${file.name}`,
	            name: file.name,
	            path: path,
	            type: file.isPackage ? "Package" : "File",
	            size: file.size,
	            contentType: file.type || FileUtils.getFileContentType(file.name)
	        }))
	    ];
	
	    return items;
	};

    const getFileContent = async (fileNode, opts) => {
        if (fileNode.isPackage) {
            const entries = await PackageUtils.processPackageFile(fileNode);
            return entries;
        }
        const content = await fileNode.getContent();
        return opts?.arrayBuffer ? content : new TextDecoder().decode(content);
    };

	const get = async (uri, opts = {}) => {
	    const parts = uri.split('/');
	    const name = parts.pop();
	    const path = parts.join('/');
	    let dirNode = TreeUtils.findNodeByPath(path, rootNode);
	
	    if (!dirNode) {
	        // If the directory is not found, search for a package (e.g., ZIP file)
	        const packageNode = await findFileByPath(path, rootNode);
	        if (!packageNode || !(await PackageUtils.isPackage(packageNode))) {
	            return { error: "Directory or package not found" };
	        }
	
	        try {
	            // Process the package (ZIP) to find the matching entry (fileNode)
	            const entries = await PackageUtils.processPackageFile(packageNode);
	            const entry = entries.find(e => e.name === name);
	
	            if (!entry) {
	                return { error: "File not found inside the package" };
	            }
	
	            // Handle nested packages or files within the ZIP
	            if (entry.isPackage) {
	                return await get(`${path}/${entry.name}`, opts);
	            }
	
	            // Return the file's content or arrayBuffer
	            const content = await entry.getContent();
	            return opts.arrayBuffer ? content : {
	                      text: new TextDecoder().decode(content),
	                      uri: `${path}/${entry.name}`,
	                      name: entry.name,
	                      path,
	                      size: entry.size || content.length,
	                      contentType: entry.contentType || FileUtils.getFileContentType(entry.name),
	                  };
	        } catch (error) {
	            return { error: `Error processing package: ${error.message}` };
	        }
	    }
	
	    // Find the fileNode in the directory
	    const fileNode = dirNode.files.find(f => f.name === name);
	
	    if (!fileNode) {
	        return { error: "File not found" };
	    }
	
	    // Return the file's content or arrayBuffer
	    const content = await getFileContent(fileNode, opts);
	
	    return opts.arrayBuffer ? content : {
              text: content,
              uri: `${path}/${name}`,
              name,
              path,
              size: fileNode.size || content.length,
              contentType: fileNode.type || FileUtils.getFileContentType(fileNode.name),
          };
	};
    // const get = async (uri, opts = {}) => {
    //     const parts = uri.split('/');
    //     const name = parts.pop();
    //     const path = parts.join('/');
    //     const dirNode = TreeUtils.findNodeByPath(path, rootNode);

    //     if (!dirNode) return { error: "Directory not found" };
    //     const fileNode = dirNode.files.find(f => f.name === name);

    //     if (!fileNode) return { error: "File not found" };
        
    //     const text = await getFileContent(fileNode, opts);
        
    //     return {
    //         link: false, uri: `${path}/${name}`,
    //         name: name, path: path, text: text, 
    //         size: fileNode.size || fileNode.fileSize || (text ? text.length : 0),
    //         contentType: fileNode.type || FileUtils.getFileContentType(fileNode.name)
    //     };
    // };

    const index = (uris) => {
        // This assumes `uris` contains a list of files to index
        uris.forEach(uri => {
            const parts = uri.split('/');
            let currentDir = rootNode;
            parts.slice(0, -1).forEach(part => {
                let dir = currentDir.directories.find(d => d.name === part);
                if (!dir) {
                    dir = TreeUtils.createNode(part);
                    currentDir.directories.push(dir);
                }
                currentDir = dir;
            });
            currentDir.files.push(TreeUtils.createNode(parts.at(-1), true));
        });
        return {
            status: "Files indexed successfully",
            files: uris
        };
    };
	
    // Return object matching the original structure
    return {

        root: rootNode,
        list: listFiles, 
        
        get, index,

        handle_document_drop: handleFileDrop,
        handle_input_change: handleInputChange,
    };
});
