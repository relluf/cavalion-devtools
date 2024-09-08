// Tree structure to hold the file metadata
const fileTree = {
	name: "root",
	files: [],
	directories: []
};

const knownPackageExtensions = ['gz', 'kmz', 'ti', 'tar', 'tar.gz', 'zip']; // Add more package extensions as needed

const handleChange = function (event) {
	// Handle the change event
	const files = event.target.files;

	let promises = [];

	// Process each file
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const path = file.webkitRelativePath || file.name;
		const parts = path.split('/');

		// Create the directory structure in the fileTree
		let currentDir = fileTree;
		for (let j = 0; j < parts.length - 1; j++) {
			let dirName = parts[j];
			let dir = currentDir.directories.find(d => d.name === dirName);

			if (!dir) {
				dir = { name: dirName, files: [], directories: [] };
				currentDir.directories.push(dir);
			}

			currentDir = dir;
		}

		// Add the file to the current directory
		promises.push(
			processFile(file, currentDir)
		);
	}

	// Wait for all files to be processed
	Promise.all(promises)
		.then(() => {
		})
		.catch((error) => {
			console.error("Error processing files: ", error);
		});
};
const handleDrop = function (event) {
	// Handle the drop event
	event.preventDefault();

	const items = event.dataTransfer.items;

	let promises = [];

	for (let i = 0; i < items.length; i++) {
		const item = items[i].webkitGetAsEntry();
		if (item) {
			// Recursively process files and directories, pushing promises into the array
			promises.push(traverse_F_ileTree(item, fileTree));
		}
	}

	// After all promises resolve, log the final structure
	Promise.all(promises)
		.then(() => {})
		.catch((error) => {
			console.error("Error processing the files: ", error);
		});
};
const traverse_F_ileTree = function(item, directoryNode) {
    if (item.isFile) {
        return getFile(item).then((file) => {
            return processFile(file, directoryNode);
        });
    } else if (item.isDirectory) {
        const dirNode = { name: item.name, files: [], directories: [] };
        directoryNode.directories.push(dirNode);

        const reader = item.createReader();
        return readAllDirectoryEntries(reader, dirNode);
    }
};

const processFile = function (fileEntry, directoryNode) {
	// Process individual files and add them to the fileTree
    return new Promise((resolve) => {
        const fileNode = {
            name: fileEntry.name,
            size: fileEntry.size,
            lastModified: fileEntry.lastModified,
            type: fileEntry.type,
            getContent: () => readFileAsArrayBuffer(fileEntry) // Use the helper function for file content
        };

        directoryNode.files.push(fileNode); // Ensure file is added to the directory node
        resolve();
    });
};
function processZipFile(file) {
    return new Promise((resolve, reject) => require(["jszip"], 
    	(JSZip) => file.getContent().then(arrayBuffer => {
	        const zip = new JSZip();
	        zip.loadAsync(arrayBuffer).then(zipContents => {
	            const entries = [];
	            zip.forEach(function(relativePath, zipEntry) {
	                entries.push({
	                    name: zipEntry.name,
	                    isFile: !zipEntry.dir, // Determine if it's a file or directory
	                    fileSize: [js.get("_data.uncompressedSize", zipEntry), js.get("_data.compressedSize", zipEntry)],
	                    getContent: () => zipEntry.async("arraybuffer") // Correct way to extract content from ZIP entry
	                });
	            });
	            resolve(entries);
	        });
	    })));
    
}
function processPackageFile(file) {
    return new Promise((resolve, reject) => {
        const extension = getFileExtension(file.name).toLowerCase();

        // Determine the type of package based on extension or other methods
        if (extension === "zip" || extension === "ti") {
            processZipFile(file)
                .then(resolve) // Resolve with the ZIP file contents
                .catch(reject); // Handle any errors in ZIP processing
        } else {
            // Future: Add other package processors (e.g., for TAR, GZ)
            reject("Unsupported package type");
        }
    });
}

function createResourceItem(item, path, isFile = false) {
    if (isFile) {
        // For files, add size, extension, and contentType
        return {
            name: item.name,
            path: path,
            type: "File",
            uri: `${path}/${item.name}`,
            size: item.size, // File size in bytes
            extension: getFileExtension(item.name), // Extract extension
            contentType: item.type || getFileContentType(item.name) // MIME type or inferred
        };
    } else {
        // For folders, include an empty array to hold the names of its sub-items
        return {
            name: item.name,
            path: path,
            type: "Folder",
            uri: `${path}/${item.name}`,
            items: [] // Array to hold the names of sub-items
        };
    }
}
function flattenDirectoryRecursively(node, currentPath) {
    let result = [];

    // Add directories at this level
    node.directories.forEach(dir => {
        const dirPath = `${currentPath}/${dir.name}`;
        const dirResource = createResourceItem(dir, currentPath, false); // Use helper for folders
        dirResource.items = [...dir.directories.map(d => d.name), ...dir.files.map(f => f.name)]; // Add names of sub-items

        result.push(dirResource);

        // Recursively add the contents of this directory
        result = result.concat(flattenDirectoryRecursively(dir, dirPath));
    });

    // Add files at this level
    node.files.forEach(file => {
        result.push(createResourceItem(file, currentPath, true)); // Use helper for files
    });

    return result;
}

const getFile = function (item) {
	// Helper function to get the file from the fileEntry object
	return new Promise((resolve, reject) => {
		item.file((file) => {
			if (file) {
				resolve(file); // Return the file if successfully retrieved
			} else {
				reject("Failed to get file");
			}
		});
	});
};
const readAllDirectoryEntries = function (directoryReader, dirNode) {
	// Read all entries in a directory using the reader, recursively, to ensure all entries are fetched
	return new Promise((resolve, reject) => {
		const entries = [];

		const readEntries = function () {
			directoryReader.readEntries((result) => {
				if (result.length > 0) {
					let promises = result.map((entry) => {
						return traverse_F_ileTree(entry, dirNode); // Recursively process the directory
					});

					// Process all entries before continuing
					Promise.all(promises)
						.then(() => {
							readEntries(); // Recursively keep reading the next batch of entries
						})
						.catch((error) => {
							reject(error);
						});
				} else {
					resolve(); // Resolve when no more entries
				}
			}, (error) => {
				console.error(`Error reading directory entries: ${error}`);
				reject(error);
			});
		};

		readEntries(); // Start reading entries
	});
};

function getFileExtension(fileName) {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop() : ''; // Returns the extension or an empty string
}
function getFileContentType(fileName) {
    const extension = getFileExtension(fileName).toLowerCase();
    const mimeTypes = {
        'txt': 'text/plain',
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'pdf': 'application/pdf',
        'zip': 'application/zip',
        // Add other common file types here
    };

    return mimeTypes[extension] || 'application/octet-stream'; // Default to binary stream if unknown
}
function getFileContent(fileNode, fileName, path) {
    // If the file is not a ZIP, return the content directly
    path = path || fileNode.path;
    return isPackage(fileNode).then(is => {
        if(!is) {
        	return fileNode.getContent()
	            .then(content => {
	                // Assuming content is an ArrayBuffer, convert it to text
	                const text = new TextDecoder().decode(content);
	                return {
	                    uri: `${path}/${fileNode.name}`,
	                    name: fileNode.name,
	                    path: path,
	                    size: fileNode.size || fileNode.fileSize || 0,
	                    text: text,
	                    contentType: fileNode.type || null
	                };
	            })
	            .catch(error => ({
	                error: "Failed to retrieve file content"
	            }));
	    }

	    // The file is a ZIP, process it
	    return processPackageFile(fileNode)
	        .then(entries => {
	            const entry = entries.find(e => e.name === fileName) || entries[0];
	
	            if (!entry) {
	                return { error: "File not found inside the ZIP archive" };
	            }
	
	            // Recursively call getFileContent if the entry is another ZIP
	            return isPackage(entry).then(is => {
	                if(is) {
	                	return getFileContent(entry, fileName, path);
	                }
	            	
		            // Retrieve the content of the file inside the ZIP
		            return entry.getContent()
		                .then(content => {
		                    // Assuming content is an ArrayBuffer, convert it to text
		                    const text = new TextDecoder().decode(content);
		                    return {
		                        uri: `${entry.path}/${entry.name}`,
		                        name: entry.name,
		                        path: entry.path,
		                        size: entry.fileSize,
		                        text: text,
		                        contentType: entry.type || null
		                    };
		                });
	            });
	
	        })
	        .catch(error => ({
	            error: "Failed to retrieve file from ZIP archive"
	        }));
	});
}
function findDirectoryByPath(path, currentNode = fileTree) {
// Retrieve a directory node by path
	const parts = path.split('/').filter(Boolean);
	let node = currentNode;

	for (let part of parts) {
		const foundDir = node.directories.find(dir => dir.name === part);
		if (foundDir) {
			node = foundDir;
		} else {
			return null; // Path not found
		}
	}
	return node;
}
function findFileByPath(path, currentNode = fileTree) {
    const parts = path.split('/').filter(Boolean);
    let node = currentNode;

    for (let i = 0; i < parts.length - 1; i++) {
        const dir = node.directories.find(d => d.name === parts[i]);
        if (!dir) {
            return null; // Path not found
        }
        node = dir;
    }

    const fileName = parts[parts.length - 1];
    const fileNode = node.files.find(f => f.name === fileName);
    return fileNode || null; // Return the file if found, or null
}
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (err) => reject(err);

        // Read the file as an ArrayBuffer
        reader.readAsArrayBuffer(file);
    });
}
function isZipFileBySignature(file) {
    return new Promise((resolve, reject) => {
        // Use the file's getContent method to retrieve the content
        file.getContent().then(content => {
            // Convert content to Uint8Array and check for ZIP signature
            const buffer = new Uint8Array(content);
            const zipSignature = [0x50, 0x4B, 0x03, 0x04]; // PK.. signature

            // Ensure there are at least 4 bytes to check
            if (buffer.length < 4) {
                return resolve(false);
            }

            // Compare the first 4 bytes with the ZIP signature
            const isZip = buffer[0] === zipSignature[0] &&
                          buffer[1] === zipSignature[1] &&
                          buffer[2] === zipSignature[2] &&
                          buffer[3] === zipSignature[3];

            resolve(isZip);
        }).catch(error => {
            reject("Failed to read file content: " + error);
        });
    });
}
function isPackage(file) {
    const extension = getFileExtension(file.name).toLowerCase();

    // Check if the extension is a known package extension
    if (knownPackageExtensions.includes(extension)) {
        return Promise.resolve(true);
    }

    // For unknown extensions, check the file signature (e.g., ZIP signature)
    return isZipFileBySignature(file);
}

// API definition
define(function(require) {

	document.addEventListener('dragover', (event) => event.preventDefault());
	document.addEventListener('drop', handleDrop);

	return {
		index: function(uris) {
			// Index the initial URIs (here, we assume files have been added via drag/drop or otherwise)
			// You can modify this function to initialize the fileTree based on URIs
			return {
				status: "Files indexed successfully",
				files: uris // Or file metadata from fileTree
			};
		},
		list: async function(path, opts = { recursive: false }) {
		    // Find the directory node based on the provided path
		    const dirNode = findDirectoryByPath(path);
		
		    if (!dirNode) {
		        // If no directory is found, check for a package (ZIP file)
		        const packageNode = findFileByPath(path);
		        if (!packageNode || !(await isPackage(packageNode))) {
		            return { error: "Path not found" };
		        }
		
		        // Process the package (ZIP) and return its contents
		        const entries = await processPackageFile(packageNode);
		        return entries.map(entry => ({
		            name: entry.name,
		            path: path,
		            type: entry.isFile ? "File" : "Folder",
		            fileSize: entry.fileSize,
		            uri: `${path}/${entry.name}`,
		            contentType: entry.contentType
		        }));
		    }
		
		    // If recursive option is enabled, recursively list the directory structure
		    if (opts.recursive) {
		        const flattenDirectoryRecursively = (node, currentPath) => {
		            let result = [];
		
		            // Process directories
		            node.directories.forEach(dir => {
		                const dirPath = `${currentPath}/${dir.name}`;
		                result.push({
		                    uri: dirPath,
		                    name: dir.name,
		                    path: currentPath,
		                    type: "Folder"
		                });
		
		                // Recursively flatten the directory structure
		                result = result.concat(flattenDirectoryRecursively(dir, dirPath));
		            });
		
		            // Process files
		            node.files.forEach(file => {
		                result.push({
		                    uri: `${currentPath}/${file.name}`,
		                    name: file.name,
		                    path: currentPath,
		                    type: "File",
		                    fileSize: file.size,
		                    contentType: file.type || null
		                });
		            });
		
		            return result;
		        };
		
		        // Recursively flatten the directory structure starting from the dirNode
		        return flattenDirectoryRecursively(dirNode, path);
		    }
		
		    // Otherwise, return just one level deep for regular directories
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
		            type: "File",
		            fileSize: file.size,
		            contentType: file.type || null
		        }))
		    ];
		
		    return items;
		},
		get: async function(uri) {
			// Get file content on demand (for both regular files and ZIP contents)
		    const parts = uri.split('/');
		    const fileName = parts.pop();
		    const directoryPath = parts.join('/');
		    let dirNode = findDirectoryByPath(directoryPath);
		
		    if (!dirNode) {
		        // If no directory is found, search for a matching package (ZIP or other package file)
		        const packageNode = findFileByPath(directoryPath);
		
		        // Use isPackage() to check if the file is a package
		        if (!packageNode || !(await isPackage(packageNode))) {
		            return { error: "Directory or package not found" };
		        }
		
		        try {
		            // Process the package (ZIP) to find the matching entry (fileNode)
		            const entries = await processPackageFile(packageNode);
		            const entry = entries.find(e => e.name === fileName);
		
		            if (!entry) {
		                return { error: "File not found inside the package" };
		            }
		
		            // Treat the entry as a fileNode and call getFileContent
		            return await getFileContent(entry, fileName, directoryPath);
		        } catch (error) {
		            return { error: "Error processing package: " + error };
		        }
		    }
		
		    // Find the fileNode in the directory
		    const fileNode = dirNode.files.find(file => file.name === fileName);
		
		    if (!fileNode) {
		        return { error: "File not found" };
		    }
		
		    // Call getFileContent to retrieve the file content, whether it's a regular file or inside a package
		    return await getFileContent(fileNode, fileName, directoryPath);
		},
		
		handle_document_drop: handleDrop,
		handle_input_change: handleChange

	};
});