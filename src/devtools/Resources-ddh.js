define(function(require) {
	const PackageHandlerRegistry = {
	    handlers: {},
	
	    registerHandler: (extension, handler, dependencies = {}) => {
	        PackageHandlerRegistry.handlers[extension] = { handler, dependencies };
	    },
	    getHandler: (extension) => {
	        return PackageHandlerRegistry.handlers[extension];
	    },
	    canHandle: (extension) => {
	        return !!PackageHandlerRegistry.getHandler(extension);
	    },
	    processFile: async (file, uri) => {
	        const extension = FileUtils.getFileExtension(file.name);
	        const registered = PackageHandlerRegistry.getHandler(extension);
	        if (registered) {
	            const { handler, dependencies } = registered;
	            return handler(file, uri, dependencies);
	        }
	        throw new Error(`No handler registered for extension: ${extension}`);
	    },
	};
	
	const FileUtils = {
	    getFileExtension: (fileName) => ("" + fileName).split('.').pop().toLowerCase() || "",
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
			    'shx': 'application/x-shapefile',
			    'dbf': 'application/x-dbf',
			    'prj': 'application/x-prj',
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
	    knownExtensions: ['zip', 'tar', 'gz', 'kmz', '7z', 'rar', 'iso', 'shp', 'gz'], // Add more extensions here if needed
		isPackage: (file) => {
		    const extension = FileUtils.getFileExtension(file.name);
		    if (PackageUtils.knownExtensions.includes(extension)) {
		        return true;
		    }
		    
		    // Fallback to handler-specific checks
		    if (PackageHandlerRegistry.canHandle(extension)) {
		        // const handler = PackageHandlerRegistry.getHandler(extension);
		        // if (handler.isPackage) {
		        //     return await handler.isPackage(file); // Assume handler supports async checks
		        // }
		        return true;
		    }
		    return false;
		},
	    processPackageFile: async (file, uri) => {
	        const extension = FileUtils.getFileExtension(file.name);
	        if (PackageHandlerRegistry.canHandle(extension)) {
	            return PackageHandlerRegistry.processFile(file, uri);
	        }
	        throw new Error(`Unsupported package type: ${extension}`);
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

    const rootNode = TreeUtils.createNode("root");

	const readAllEntries = (reader) => {
	    const entries = [];
	    return new Promise((resolve, reject) => {
	        const readBatch = () => {
	            reader.readEntries(
	                (batch) => {
	                    if (batch.length) {
	                        entries.push(...batch);
	                        readBatch();
	                    } else {
	                        resolve(entries);
	                    }
	                },
	                (err) => {
	                    console.warn("Failed to read directory entries", err);
	                    reject(err);
	                }
	            );
	        };
	        readBatch();
	    });
	};
	const traverseEntry = async (entry, directoryNode) => {
	    if (entry.isFile) {
	        const file = await getFileFromEntry(entry);
	        return TreeUtils.addFileToNode(directoryNode, file);
	    }
	
	    const dirNode = TreeUtils.createNode(entry.name);
	    directoryNode.directories.push(dirNode);
	
	    try {
	        const reader = entry.createReader();
	        const entries = await readAllEntries(reader);
	
	        // Process entries in batches
	        const batchSize = 50; // Adjust batch size for performance
	        for (let i = 0; i < entries.length; i += batchSize) {
	            const batch = entries.slice(i, i + batchSize);
	            await Promise.allSettled(batch.map((e) => traverseEntry(e, dirNode)));
	        }
	    } catch (err) {
	        console.warn(`Failed to traverse directory: ${entry.name}`, err);
	    }
	
	    return dirNode;
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
	const findFileByPath = async (path, currentNode = rootNode, opts = { recursePackages: true }) => {
	    const parts = path.split('/').filter(Boolean); // Split and clean up the path
	    let node = currentNode;
	
	    for (let i = 0; i < parts.length - 1; i++) {
	        const dirName = parts[i];
	        const dir = node.directories.find(d => d.name === dirName);
	
	        if (!dir) {
	            const file = node.files.find(f => f.name === dirName);
	
	            // If it's a package file, process it if the option is enabled
	            if (file && opts.recursePackages && PackageUtils.isPackage(file)) {
	                const entries = await PackageUtils.processPackageFile(file, path);
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

	const getRelatedFiles = async (baseUri, extensions, getFileFn) => {
	    const relatedFiles = {};
	    await Promise.all(
	        extensions.map(async (ext) => {
	            try {
	                const file = await getFileFn(`${baseUri}.${ext}`, { arrayBuffer: true });
	                if (file) relatedFiles[ext] = file;
	            } catch (err) {
	                console.warn(`Related file .${ext} not found for base ${baseUri}`);
	            }
	        })
	    );
	    return relatedFiles;
	};
    const getFileFromEntry = (entry) => new Promise((resolve, reject) => entry.file(resolve, reject));
    const getFileContent = async (fileNode, opts) => {
        if (fileNode.isPackage) {
console.log("!!! could not determine uri"); debugger;
            const entries = await PackageUtils.processPackageFile(fileNode);
            return entries;
        }
        const content = await fileNode.getContent();
        return opts?.arrayBuffer ? content : new TextDecoder().decode(content);
    };
	const getPackageFile = async (packageFile, fileName, baseUri, opts) => {
	    // Ensure the file is a package
	    if (!PackageUtils.isPackage(packageFile)) {
	        throw new Error(`File at URI "${baseUri}" is not a recognized package.`);
	    }
	
	    // Process the package and look for the specified file
	    const entries = await PackageUtils.processPackageFile(packageFile, baseUri);
	    const entry = entries.find(e => e.name === fileName);
	
	    if (!entry) {
	        return { error: `File "${fileName}" not found in package at "${baseUri}".` };
	    }
	
	    // Return content or metadata
	    const content = await entry.getContent();
	    return opts.arrayBuffer
	        ? content
	        : {
	              text: new TextDecoder().decode(content),
	              uri: `${baseUri}/${entry.name}`,
	              name: entry.name,
	              size: entry.size || content.length,
	              contentType: entry.contentType || FileUtils.getFileContentType(entry.name),
	          };
	};

	const listPackageContents = async (packageFile, uri, opts) => {
	    // Check if the file is a package
	    if (!PackageUtils.isPackage(packageFile)) {
	        throw new Error(`File at URI "${uri}" is not a recognized package.`);
	    }
	
	    // Process the package and return its entries
	    const entries = await PackageUtils.processPackageFile(packageFile, uri);
	
	    // Map entries with full URIs and metadata
	    return entries.map(entry => ({
	        uri: `${uri}/${entry.name}`,
	        name: entry.name,
	        type: entry.isPackage ? "Package" : "File",
	        size: entry.size || 0,
	        contentType: entry.contentType || FileUtils.getFileContentType(entry.name),
	    }));
	};
	const list = async (path, opts = { recursive: false, recursePackages: false }) => {
	    const dirNode = TreeUtils.findNodeByPath(path, rootNode);
	
	    if (!dirNode) {
	        const packageNode = await findFileByPath(path);
	        if (!packageNode) {
	            return { error: `Path "${path}" not found` };
	        }
	
	        // Delegate package-specific logic to listPackageContents
	        return listPackageContents(packageNode, path, opts);
	    }
	
	    // Handle standard directory listing
	    const items = [
	        ...dirNode.directories.map(dir => ({
	            uri: `${path}/${dir.name}`,
	            name: dir.name,
	            type: "Folder",
	        })),
	        ...dirNode.files.map(file => ({
	            uri: `${path}/${file.name}`,
	            name: file.name,
	            type: PackageUtils.isPackage(file) ? "Package" : "File",
	            size: file.size,
	            contentType: FileUtils.getFileContentType(file.name),
	        })),
	    ];
	
	    return opts.recursive ? flattenDirectoryRecursively(dirNode, path) : items;
	};
	const get = async (uri, opts = {}) => {
	    const parts = uri.split('/');
	    const name = parts.pop();
	    const path = parts.join('/');
	    const dirNode = TreeUtils.findNodeByPath(path, rootNode);
	
	    if (!dirNode) {
	        // If directory is not found, check for a package
	        const packageNode = await findFileByPath(path);
	        if (!packageNode) {
	            return { error: `Path "${path}" not found` };
	        }
	
	        // Delegate package-specific logic to getPackageFile
	        return getPackageFile(packageNode, name, path, opts);
	    }
	
	    // Handle standard file retrieval
	    const fileNode = dirNode.files.find(f => f.name === name);
	    if (!fileNode) {
	        return { error: `File "${name}" not found at "${path}".` };
	    }
	
	    const content = await getFileContent(fileNode, opts);
	    return opts.arrayBuffer
	        ? content
	        : {
	              text: content,
	              uri: `${path}/${name}`,
	              name,
	              size: fileNode.size || content.length,
	              contentType: FileUtils.getFileContentType(fileNode.name),
	          };
	};
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

    const handle_document_drop = async (event) => {
        event.preventDefault();
        const promises = Array.from(event.dataTransfer.items)
            .map(item => item.webkitGetAsEntry())
            .filter(Boolean)
            .map(entry => traverseEntry(entry, rootNode));
        return await Promise.all(promises);
    };
    const handle_input_change = async (event) => {
        const files = event.target.files;
        const promises = Array.from(files).map(file => traverseFile(file, rootNode));
        return await Promise.all(promises);
    };


	// Default Handlers
	PackageHandlerRegistry.registerHandler('zip', async (file, uri) => {
	    return new Promise((resolve, reject) => {
	        require(['jszip'], (JSZip) => {
	            file.getContent()
	                .then(buffer => new JSZip().loadAsync(buffer))
	                .then(zip => {
	                    const entries = Object.entries(zip.files).map(([name, zipEntry]) => ({
	                        name,
	                        isFile: !zipEntry.dir,
	                        size: zipEntry._data.uncompressedSize,
	                        getContent: () => zipEntry.async('arraybuffer'),
	                        isPackage: PackageUtils.knownExtensions.includes(FileUtils.getFileExtension(name)),
	                    }));
	                    resolve(entries.filter(e => !e.name.startsWith("__MACOSX/")));
	                })
	                .catch(reject);
	        }, reject);
	    });
	});
	PackageHandlerRegistry.registerHandler('shp', async (file, uri, { getFile }) => {
	    return new Promise((resolve, reject) => {
	        require(['shapefile'], (shapefile) => {
	            const baseUri = uri.replace(/\.shp$/, '');
	            getRelatedFiles(baseUri, ['dbf'/*, 'shx', 'prj'*/], getFile)
	                .then((relatedFiles) => {
	                    const { dbf } = relatedFiles;
	                    return Promise.all([file.getContent(), dbf]);
	                })
	                .then(([shp, dbf]) => 
	                    shapefile.open(new Uint8Array(shp), dbf ? new Uint8Array(dbf) : null)
	                )
	                .then((source) => {
	                    const features = [];
	                    const readNextFeature = () => {
	                        return source.read().then((result) => {
	                            if (!result.done) {
	                                features.push(result.value);
	                                return readNextFeature();
	                            }
	                            return features;
	                        });
	                    };
	                    return readNextFeature();
	                })
	                .then((features) => {
	                	features = { name: file.name, features };
	                    resolve([
	                        {
	                            uri: `${uri}/features.geojson`,
	                            name: 'features.geojson',
	                            type: 'File',
	                            contentType: 'application/json',
	                            getContent: () => Promise.resolve(new TextEncoder().encode(JSON.stringify(features))),
	                        }
	                    ]);
	                })
	                .catch(reject);
	        }, reject);
	    });
	}, { getFile: get });

	PackageHandlerRegistry.registerHandler('gz', async (file, uri) => {
	    return new Promise((resolve, reject) => {
	        require(['pako'], (pako) => {
	            file.getContent()
	                .then(buffer => {
	                    const decompressed = pako.inflate(new Uint8Array(buffer));
	                    const decompressedFileName = file.name.replace(/\.gz$/, '');
	                    const extension = FileUtils.getFileExtension(decompressedFileName);
	
	                    // Create a virtual file object for the decompressed content
	                    const decompressedFile = {
	                        name: decompressedFileName,
	                        getContent: () => Promise.resolve(decompressed),
	                    };
	
	                    // Check if a handler exists for the decompressed file type
	                    if (PackageHandlerRegistry.canHandle(extension)) {
	                        return PackageHandlerRegistry.processFile(decompressedFile, uri);
	                    }
	
	                    // If no handler exists, return the raw decompressed content
	                    return [{
	                        name: decompressedFileName,
	                        size: decompressed.length,
	                        content: new TextDecoder().decode(decompressed),
	                        type: FileUtils.getFileContentType(decompressedFileName),
	                    }];
	                })
	                .then(resolve)
	                .catch(reject);
	        }, reject);
	    });
	});
	PackageHandlerRegistry.registerHandler('qgz', async (file, uri, { zip }) => {
	    if (!zip) {
	        throw new Error("ZIP handler is required for .qgz files");
	    }
	
	    const zipResult = await zip(file, uri);
	    const projectFile = zipResult.find(entry => entry.name.endsWith('.qgs'));
	
	    return [
	        ...(projectFile
	            ? [{
	                  uri: `${uri}/${projectFile.name}`,
	                  name: projectFile.name,
	                  type: 'File',
	                  contentType: 'application/xml',
	                  getContent: projectFile.getContent,
	              }]
	            : []),
	        ...zipResult,
	    ];
	}, { zip: PackageHandlerRegistry.getHandler('zip').handler });
	PackageHandlerRegistry.registerHandler('sqlite', async (file, uri) => {
	
		// Helper: Convert SQLite data to TSV
		function dataToTSV(data) {
		    const headers = data.columns.join('\t');
		    const rows = data.values.map(row => row.join('\t')).join('\n');
		    return `${headers}\n${rows}`;
		}
	
	
	    return new Promise((resolve, reject) => {
			require(["sqlite"], initSqlJs => {
				initSqlJs({
					// Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
					// You can omit locateFile completely when running in node
					locateFile: file => `https://sql.js.org/dist/${file}`
				}).then(SQL => file.getContent().then(content => {
				    const db = new SQL.Database(new Uint8Array(content));
				
				    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table';")[0].values.flat();
				    const views = [];//db.exec("SELECT name FROM sqlite_master WHERE type='view';")[0]?.values.flat();
				
				    const entries = [];
				
				    // Add tables as folders
				    for (const table of tables) {
				        const schema = db.exec(`PRAGMA table_info(${table});`);
				        const data = db.exec(`SELECT * FROM ${table};`);
				
				        entries.push({
				            name: `${table}/data.tsv`,
				            isFile: true,
				            size: JSON.stringify(data).length,
				            getContent: () => Promise.resolve(new TextEncoder().encode(dataToTSV(data)))
				        });
				
				        entries.push({
				            name: `${table}/schema.json`,
				            isFile: true,
				            size: JSON.stringify(schema).length,
				            getContent: () => Promise.resolve(new TextEncoder().encode(JSON.stringify(schema))),
				        });
				    }
				
				    // Add views as files
				    for (const view of views) {
				        const viewData = db.exec(`SELECT * FROM ${view};`);
				        entries.push({
				            name: `${view}.tsv`,
				            isFile: true,
				            size: JSON.stringify(viewData).length,
				            getContent: () => Promise.resolve(new TextEncoder().encode(dataToTSV(viewData))),
				        });
				    }
				
				    resolve(entries);
			    }));
			});
		});
	});


    // Return object matching the original structure
    return {

        root: rootNode,
        
        list, get, index,

        handle_document_drop,
        handle_input_change
    };
});