// 가상 파일시스템 클래스
class VirtualFileSystem {
    constructor() {
        // 파일시스템 초기화
        this.fs = {
            '/': {
                type: 'directory',
                created: new Date(),
                modified: new Date(),
                children: {
                    'example.txt': {
                        type: 'file',
                        content: '이것은 예제 파일입니다.\n여러 줄의 텍스트를 포함할 수 있습니다.',
                        created: new Date(),
                        modified: new Date()
                    },
                    'config.json': {
                        type: 'file',
                        content: '{\n  "name": "가상 파일시스템",\n  "version": "1.0.0",\n  "description": "브라우저에서 Node.js fs 모듈 시뮬레이션"\n}',
                        created: new Date(),
                        modified: new Date()
                    },
                    'images': {
                        type: 'directory',
                        created: new Date(),
                        modified: new Date(),
                        children: {
                            'photo.png': {
                                type: 'file',
                                content: '[가상 이미지 데이터]',
                                created: new Date(),
                                modified: new Date()
                            }
                        }
                    },
                    'logs': {
                        type: 'directory',
                        created: new Date(),
                        modified: new Date(),
                        children: {
                            'app.log': {
                                type: 'file',
                                content: '2023-07-15 10:30:22 - Application started\n2023-07-15 10:35:42 - User logged in',
                                created: new Date(),
                                modified: new Date()
                            }
                        }
                    }
                }
            }
        };
    }
    
    // 경로 분할
    parsePath(path) {
        if (path === '/') return ['/', null];
        
        // 절대 경로 확인
        const isAbsolute = path.startsWith('/');
        const normalizedPath = isAbsolute ? path : `/${path}`;
        
        const parts = normalizedPath.split('/').filter(p => p !== '');
        const fileName = parts.pop();
        const dirPath = isAbsolute ? `/${parts.join('/')}` : parts.join('/');
        
        return [dirPath || '/', fileName];
    }
    
    // 디렉토리 찾기
    findDirectory(path) {
        if (path === '/') return this.fs['/'];
        
        const parts = path.split('/').filter(p => p !== '');
        let current = this.fs['/'];
        
        for (const part of parts) {
            if (!current.children || !current.children[part] || current.children[part].type !== 'directory') {
                return null;
            }
            current = current.children[part];
        }
        
        return current;
    }
    
    // 파일 또는 디렉토리 찾기
    findNode(path) {
        if (path === '/') return this.fs['/'];
        
        const [dirPath, fileName] = this.parsePath(path);
        const dir = this.findDirectory(dirPath);
        
        if (!dir || !fileName) return dir;
        if (!dir.children || !dir.children[fileName]) return null;
        
        return dir.children[fileName];
    }
    
    // 파일 읽기
    readFile(path, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = { encoding: null };
        }
        
        if (typeof options === 'string') {
            options = { encoding: options };
        }
        
        setTimeout(() => {
            try {
                const node = this.findNode(path);
                
                if (!node) {
                    const error = new Error(`ENOENT: no such file or directory, open '${path}'`);
                    error.code = 'ENOENT';
                    return callback(error);
                }
                
                if (node.type !== 'file') {
                    const error = new Error(`EISDIR: illegal operation on a directory, read '${path}'`);
                    error.code = 'EISDIR';
                    return callback(error);
                }
                
                const content = options.encoding ? node.content : new TextEncoder().encode(node.content);
                callback(null, content);
            } catch (error) {
                callback(error);
            }
        }, 100);
    }
    
    // 파일 읽기 (동기)
    readFileSync(path, options) {
        if (typeof options === 'string') {
            options = { encoding: options };
        }
        
        options = options || { encoding: null };
        
        const node = this.findNode(path);
        
        if (!node) {
            const error = new Error(`ENOENT: no such file or directory, open '${path}'`);
            error.code = 'ENOENT';
            throw error;
        }
        
        if (node.type !== 'file') {
            const error = new Error(`EISDIR: illegal operation on a directory, read '${path}'`);
            error.code = 'EISDIR';
            throw error;
        }
        
        return options.encoding ? node.content : new TextEncoder().encode(node.content);
    }
    
    // 파일 쓰기
    writeFile(path, data, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = { encoding: 'utf8' };
        }
        
        if (typeof options === 'string') {
            options = { encoding: options };
        }
        
        options = options || { encoding: 'utf8' };
        
        setTimeout(() => {
            try {
                const [dirPath, fileName] = this.parsePath(path);
                const dir = this.findDirectory(dirPath);
                
                if (!dir) {
                    const error = new Error(`ENOENT: no such file or directory, open '${path}'`);
                    error.code = 'ENOENT';
                    return callback(error);
                }
                
                // 파일이 이미 존재하는지 확인
                if (dir.children[fileName] && dir.children[fileName].type === 'directory') {
                    const error = new Error(`EISDIR: illegal operation on a directory, write '${path}'`);
                    error.code = 'EISDIR';
                    return callback(error);
                }
                
                // 파일 생성 또는 업데이트
                const now = new Date();
                dir.children[fileName] = {
                    type: 'file',
                    content: data.toString(),
                    created: dir.children[fileName] ? dir.children[fileName].created : now,
                    modified: now
                };
                
                dir.modified = now;
                callback(null);
            } catch (error) {
                callback(error);
            }
        }, 100);
    }
    
    // 파일에 내용 추가
    appendFile(path, data, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = { encoding: 'utf8' };
        }
        
        if (typeof options === 'string') {
            options = { encoding: options };
        }
        
        options = options || { encoding: 'utf8' };
        
        setTimeout(() => {
            try {
                const node = this.findNode(path);
                
                if (node && node.type === 'file') {
                    // 파일이 존재하면 내용 추가
                    const [dirPath, fileName] = this.parsePath(path);
                    const dir = this.findDirectory(dirPath);
                    
                    dir.children[fileName].content += data.toString();
                    dir.children[fileName].modified = new Date();
                    dir.modified = new Date();
                    
                    callback(null);
                } else if (node && node.type === 'directory') {
                    // 디렉토리인 경우 오류
                    const error = new Error(`EISDIR: illegal operation on a directory, append '${path}'`);
                    error.code = 'EISDIR';
                    callback(error);
                } else {
                    // 파일이 없으면 생성
                    this.writeFile(path, data, options, callback);
                }
            } catch (error) {
                callback(error);
            }
        }, 100);
    }
    
    // 디렉토리 생성
    mkdir(path, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        
        options = options || {};
        
        setTimeout(() => {
            try {
                const [dirPath, dirName] = this.parsePath(path);
                const parentDir = this.findDirectory(dirPath);
                
                if (!parentDir) {
                    if (options.recursive) {
                        // 재귀적으로 상위 디렉토리 생성
                        this.mkdirRecursive(path, callback);
                        return;
                    } else {
                        const error = new Error(`ENOENT: no such file or directory, mkdir '${path}'`);
                        error.code = 'ENOENT';
                        return callback(error);
                    }
                }
                
                if (parentDir.children[dirName]) {
                    const error = new Error(`EEXIST: file already exists, mkdir '${path}'`);
                    error.code = 'EEXIST';
                    return callback(error);
                }
                
                // 디렉토리 생성
                const now = new Date();
                parentDir.children[dirName] = {
                    type: 'directory',
                    created: now,
                    modified: now,
                    children: {}
                };
                
                parentDir.modified = now;
                callback(null);
            } catch (error) {
                callback(error);
            }
        }, 100);
    }
    
    // 재귀적 디렉토리 생성
    // 주어진 경로의 모든 디렉토리를 한번에 생성
    mkdirRecursive(path, callback) {
        const parts = path.split('/').filter(p => p !== '');
        let currentPath = '/';
        
        const createNextDir = (index) => {
            if (index >= parts.length) {
                callback(null);
                return;
            }
            
            currentPath += parts[index] + '/';
            
            const dir = this.findNode(currentPath);
            if (dir && dir.type === 'directory') {
                // 이미 존재하면 다음으로
                createNextDir(index + 1);
            } else if (dir) {
                // 파일이면 오류
                const error = new Error(`EEXIST: file already exists, mkdir '${currentPath}'`);
                error.code = 'EEXIST';
                callback(error);
            } else {
                // 생성
                const [parentPath, dirName] = this.parsePath(currentPath);
                const parentDir = this.findDirectory(parentPath);
                
                const now = new Date();
                parentDir.children[dirName] = {
                    type: 'directory',
                    created: now,
                    modified: now,
                    children: {}
                };
                
                createNextDir(index + 1);
            }
        };
        
        createNextDir(0);
    }
    
    // 디렉토리 내용 읽기
    readdir(path, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = { encoding: 'utf8' };
        }
        
        options = options || { encoding: 'utf8' };
        
        setTimeout(() => {
            try {
                const dir = this.findNode(path);
                
                if (!dir) {
                    const error = new Error(`ENOENT: no such file or directory, scandir '${path}'`);
                    error.code = 'ENOENT';
                    return callback(error);
                }
                
                if (dir.type !== 'directory') {
                    const error = new Error(`ENOTDIR: not a directory, scandir '${path}'`);
                    error.code = 'ENOTDIR';
                    return callback(error);
                }
                
                const files = Object.keys(dir.children);
                callback(null, files);
            } catch (error) {
                callback(error);
            }
        }, 100);
    }
    
    // 디렉토리 내용 읽기 (동기)
    readdirSync(path, options) {
        options = options || { encoding: 'utf8' };
        
        const dir = this.findNode(path);
        
        if (!dir) {
            const error = new Error(`ENOENT: no such file or directory, scandir '${path}'`);
            error.code = 'ENOENT';
            throw error;
        }
        
        if (dir.type !== 'directory') {
            const error = new Error(`ENOTDIR: not a directory, scandir '${path}'`);
            error.code = 'ENOTDIR';
            throw error;
        }
        
        return Object.keys(dir.children);
    }
    
    // 파일 또는 디렉토리 정보 확인
    stat(path, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        
        options = options || {};
        
        setTimeout(() => {
            try {
                const node = this.findNode(path);
                
                if (!node) {
                    const error = new Error(`ENOENT: no such file or directory, stat '${path}'`);
                    error.code = 'ENOENT';
                    return callback(error);
                }
                
                const stats = this.createStats(node);
                callback(null, stats);
            } catch (error) {
                callback(error);
            }
        }, 100);
    }
    
    // Stats 객체 생성
    createStats(node) {
        const isFile = node.type === 'file';
        const isDirectory = node.type === 'directory';
        
        // 파일 크기 계산
        const size = isFile ? new TextEncoder().encode(node.content).length : 0;
        
        return {
            isFile: () => isFile,
            isDirectory: () => isDirectory,
            isBlockDevice: () => false,
            isCharacterDevice: () => false,
            isSymbolicLink: () => false,
            isFIFO: () => false,
            isSocket: () => false,
            dev: 0,
            ino: Math.floor(Math.random() * 1000000),
            mode: isFile ? 33188 : 16877, // 644 for files, 755 for directories
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: 0,
            size: size,
            blksize: 4096,
            blocks: Math.ceil(size / 512),
            atimeMs: node.modified.getTime(),
            mtimeMs: node.modified.getTime(),
            ctimeMs: node.created.getTime(),
            birthtimeMs: node.created.getTime(),
            atime: node.modified,
            mtime: node.modified,
            ctime: node.created,
            birthtime: node.created
        };
    }
    
    // 파일 삭제
    unlink(path, callback) {
        setTimeout(() => {
            try {
                const [dirPath, fileName] = this.parsePath(path);
                const dir = this.findDirectory(dirPath);
                
                if (!dir || !dir.children[fileName]) {
                    const error = new Error(`ENOENT: no such file or directory, unlink '${path}'`);
                    error.code = 'ENOENT';
                    return callback(error);
                }
                
                if (dir.children[fileName].type === 'directory') {
                    const error = new Error(`EISDIR: illegal operation on a directory, unlink '${path}'`);
                    error.code = 'EISDIR';
                    return callback(error);
                }
                
                delete dir.children[fileName];
                dir.modified = new Date();
                
                callback(null);
            } catch (error) {
                callback(error);
            }
        }, 100);
    }
    
    // 디렉토리 삭제
    rmdir(path, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        
        options = options || {};
        
        setTimeout(() => {
            try {
                const [dirPath, dirName] = this.parsePath(path);
                const parentDir = this.findDirectory(dirPath);
                
                if (!parentDir || !parentDir.children[dirName]) {
                    const error = new Error(`ENOENT: no such file or directory, rmdir '${path}'`);
                    error.code = 'ENOENT';
                    return callback(error);
                }
                
                const targetDir = parentDir.children[dirName];
                
                if (targetDir.type !== 'directory') {
                    const error = new Error(`ENOTDIR: not a directory, rmdir '${path}'`);
                    error.code = 'ENOTDIR';
                    return callback(error);
                }
                
                const isEmpty = Object.keys(targetDir.children).length === 0;
                
                if (!isEmpty && !options.recursive) {
                    const error = new Error(`ENOTEMPTY: directory not empty, rmdir '${path}'`);
                    error.code = 'ENOTEMPTY';
                    return callback(error);
                }
                
                if (options.recursive) {
                    // 재귀적으로 삭제 (하위 항목 모두 삭제)
                    this.rmdirRecursive(path, callback);
                } else {
                    // 빈 디렉토리만 삭제
                    delete parentDir.children[dirName];
                    parentDir.modified = new Date();
                    callback(null);
                }
            } catch (error) {
                callback(error);
            }
        }, 100);
    }
    
    // 재귀적 디렉토리 삭제
    rmdirRecursive(path, callback) {
        const deleteItem = (itemPath, next) => {
            const node = this.findNode(itemPath);
            
            if (!node) {
                next();
                return;
            }
            
            if (node.type === 'file') {
                this.unlink(itemPath, (err) => {
                    if (err) return callback(err);
                    next();
                });
            } else {
                // 디렉토리인 경우 하위 항목부터 삭제
                const dir = node;
                const items = Object.keys(dir.children);
                
                if (items.length === 0) {
                    // 빈 디렉토리면 바로 삭제
                    const [parentPath, dirName] = this.parsePath(itemPath);
                    const parentDir = this.findDirectory(parentPath);
                    delete parentDir.children[dirName];
                    parentDir.modified = new Date();
                    next();
                } else {
                    // 하위 항목 삭제
                    let deleted = 0;
                    
                    items.forEach(item => {
                        const subPath = itemPath === '/' ? `/${item}` : `${itemPath}/${item}`;
                        deleteItem(subPath, () => {
                            deleted++;
                            if (deleted === items.length) {
                                // 모든 하위 항목 삭제 완료 후 자신 삭제
                                const [parentPath, dirName] = this.parsePath(itemPath);
                                const parentDir = this.findDirectory(parentPath);
                                delete parentDir.children[dirName];
                                parentDir.modified = new Date();
                                next();
                            }
                        });
                    });
                }
            }
        };
        
        deleteItem(path, () => {
            callback(null);
        });
    }
    
    // 파일 또는 디렉토리 이름 변경/이동
    rename(oldPath, newPath, callback) {
        setTimeout(() => {
            try {
                const [oldDirPath, oldName] = this.parsePath(oldPath);
                const oldDir = this.findDirectory(oldDirPath);
                
                if (!oldDir || !oldDir.children[oldName]) {
                    const error = new Error(`ENOENT: no such file or directory, rename '${oldPath}' -> '${newPath}'`);
                    error.code = 'ENOENT';
                    return callback(error);
                }
                
                const [newDirPath, newName] = this.parsePath(newPath);
                const newDir = this.findDirectory(newDirPath);
                
                if (!newDir) {
                    const error = new Error(`ENOENT: no such file or directory, rename '${oldPath}' -> '${newPath}'`);
                    error.code = 'ENOENT';
                    return callback(error);
                }
                
                if (newDir.children[newName]) {
                    const error = new Error(`EEXIST: file already exists, rename '${oldPath}' -> '${newPath}'`);
                    error.code = 'EEXIST';
                    return callback(error);
                }
                
                // 항목 이동
                newDir.children[newName] = oldDir.children[oldName];
                delete oldDir.children[oldName];
                
                // 수정 시간 업데이트
                const now = new Date();
                newDir.modified = now;
                oldDir.modified = now;
                
                callback(null);
            } catch (error) {
                callback(error);
            }
        }, 100);
    }
    
    // 파일/디렉토리 존재 여부 확인 (동기)
    existsSync(path) {
        return this.findNode(path) !== null;
    }
    
    // 전체 파일시스템 구조를 HTML로 렌더링
    renderFileSystem() {
        const renderNode = (path, node) => {
            if (node.type === 'file') {
                return `<div class="file" onclick="viewFile('${path}')">${path}</div>`;
            } else {
                let html = `<div class="folder" onclick="toggleFolder(this)">${path}</div><div class="nested">`;
                
                for (const name in node.children) {
                    const childPath = path === '/' ? `/${name}` : `${path}/${name}`;
                    html += renderNode(childPath, node.children[name]);
                }
                
                html += '</div>';
                return html;
            }
        };
        
        return renderNode('/', this.fs['/']);
    }
}

// 가상 파일시스템 인스턴스 생성
const virtualFs = new VirtualFileSystem();

// Node.js fs 객체 시뮬레이션
const fs = {
    readFile: (path, options, callback) => virtualFs.readFile(path, options, callback),
    writeFile: (path, data, options, callback) => virtualFs.writeFile(path, data, options, callback),
    appendFile: (path, data, options, callback) => virtualFs.appendFile(path, data, options, callback),
    mkdir: (path, options, callback) => virtualFs.mkdir(path, options, callback),
    readdir: (path, options, callback) => virtualFs.readdir(path, options, callback),
    stat: (path, options, callback) => virtualFs.stat(path, options, callback),
    unlink: (path, callback) => virtualFs.unlink(path, callback),
    rmdir: (path, options, callback) => virtualFs.rmdir(path, options, callback),
    rename: (oldPath, newPath, callback) => virtualFs.rename(oldPath, newPath, callback),
   // existsSync: (path) => virtualFs.existsSync(path),
   // readdirSync: (path, options) => virtualFs.readdirSync(path, options),
   // readFileSync: (path, options) => virtualFs.readFileSync(path, options)
};

// Promise 기반 fs.promises API 시뮬레이션
fs.promises = {
    readFile: (path, options) => {
        return new Promise((resolve, reject) => {
            virtualFs.readFile(path, options, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    },
    writeFile: (path, data, options) => {
        return new Promise((resolve, reject) => {
            virtualFs.writeFile(path, data, options, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },
    appendFile: (path, data, options) => {
        return new Promise((resolve, reject) => {
            virtualFs.appendFile(path, data, options, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },
    mkdir: (path, options) => {
        return new Promise((resolve, reject) => {
            virtualFs.mkdir(path, options, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },
    readdir: (path, options) => {
        return new Promise((resolve, reject) => {
            virtualFs.readdir(path, options, (err, files) => {
                if (err) reject(err);
                else resolve(files);
            });
        });
    },
    stat: (path, options) => {
        return new Promise((resolve, reject) => {
            virtualFs.stat(path, options, (err, stats) => {
                if (err) reject(err);
                else resolve(stats);
            });
        });
    },
    unlink: (path) => {
        return new Promise((resolve, reject) => {
            virtualFs.unlink(path, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },
    rmdir: (path, options) => {
        return new Promise((resolve, reject) => {
            virtualFs.rmdir(path, options, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },
    rename: (oldPath, newPath) => {
        return new Promise((resolve, reject) => {
            virtualFs.rename(oldPath, newPath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
};

// DOM 요소
const consoleOutput = document.getElementById('console');
const codeInput = document.getElementById('codeInput');
const fileTreeElement = document.getElementById('fileTree');

// 파일 트리 초기 렌더링
updateFileTree();

// 코드 실행 함수
function executeCode() {
    const code = codeInput.value.trim();
    if (!code) return;
    
    logToConsole(`> ${code}`, 'command');
    
    try {
        // 비동기 코드를 처리하기 위한 함수 래핑
        const wrappedCode = `
            (async function() {
                try {
                    ${code}
                } catch (error) {
                    console.error(error);
                }
            })();
        `;
        
        // 콘솔 로그 함수 재정의
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        
        console.log = function() {
            const args = Array.from(arguments);
            logToConsole(args.map(arg => formatLogValue(arg)).join(' '));
            originalConsoleLog.apply(console, arguments);
        };
        
        console.error = function() {
            const args = Array.from(arguments);
            logToConsole(args.map(arg => formatLogValue(arg)).join(' '), 'error');
            originalConsoleError.apply(console, arguments);
        };
        
        // 코드 실행
        eval(wrappedCode);
        
        // 파일시스템 트리 업데이트
        setTimeout(updateFileTree, 200);
        
        // 콘솔 함수 복원
        setTimeout(() => {
            console.log = originalConsoleLog;
            console.error = originalConsoleError;
        }, 500);
    } catch (error) {
        logToConsole(`오류: ${error.message}`, 'error');
    }
}

// 콘솔에 출력하는 함수
function logToConsole(message, type = 'normal') {
    const line = document.createElement('div');
    line.textContent = message;
    
    if (type === 'error') {
        line.className = 'error';
    } else if (type === 'command') {
        line.style.color = '#f1c40f';
    } else if (type === 'success') {
        line.className = 'success';
    }
    
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// 콘솔 출력 지우기
function clearConsole() {
    consoleOutput.innerHTML = '';
}

// 파일시스템 트리 업데이트
function updateFileTree() {
    fileTreeElement.innerHTML = virtualFs.renderFileSystem();
}

// 코드 샘플 삽입
function insertCode(code) {
    if (code === 'clear()') {
        clearConsole();
        return;
    }
    
    const examples = {
        'fs.readFile': `fs.readFile('/example.txt', 'utf8', (err, data) => {
if (err) {
console.error('Error:', err);
return;
}
console.log('파일 내용:', data);
});`,
        'fs.writeFile': `fs.writeFile('/newfile.txt', '새로운 파일 내용입니다!', 'utf8', (err) => {
if (err) {
console.error('Error:', err);
return;
}
console.log('파일이 성공적으로 작성되었습니다.');
});`,
        'fs.appendFile': `fs.appendFile('/example.txt', '\\n추가된 새로운 줄입니다.', 'utf8', (err) => {
if (err) {
console.error('Error:', err);
return;
}
console.log('파일에 내용이 추가되었습니다.');
});`,
        'fs.mkdir': `fs.mkdir('/newdir', (err) => {
if (err) {
console.error('Error:', err);
return;
}
console.log('디렉토리가 생성되었습니다.');
});`,
        'fs.readdir': `fs.readdir('/', (err, files) => {
if (err) {
console.error('Error:', err);
return;
}
console.log('디렉토리 내용:', files);
});`,
        'fs.stat': `fs.stat('/example.txt', (err, stats) => {
if (err) {
console.error('Error:', err);
return;
}
console.log('파일 정보:', stats);
console.log('파일 크기:', stats.size, '바이트');
console.log('생성일:', stats.birthtime);
console.log('is파일?', stats.isFile());
console.log('is디렉토리?', stats.isDirectory());
});`,
        'fs.unlink': `fs.unlink('/example.txt', (err) => {
if (err) {
console.error('Error:', err);
return;
}
console.log('파일이 삭제되었습니다.');
});`,
        'fs.rmdir': `fs.rmdir('/logs', (err) => {
if (err) {
console.error('Error:', err);
return;
}
console.log('디렉토리가 삭제되었습니다.');
});`,
        'fs.rename': `fs.rename('/example.txt', '/renamed.txt', (err) => {
if (err) {
console.error('Error:', err);
return;
}
console.log('파일 이름이 변경되었습니다.');
});`,
        'fs.existsSync': `if (fs.existsSync('/example.txt')) {
console.log('파일이 존재합니다.');
} else {
console.log('파일이 존재하지 않습니다.');
}`,
        'fs.readdirSync': `try {
const files = fs.readdirSync('/');
console.log('디렉토리 내용(동기):', files);
} catch (err) {
console.error('Error:', err);
}`,
        'fs.readFileSync': `try {
const data = fs.readFileSync('/example.txt', 'utf8');
console.log('파일 내용(동기):', data);
} catch (err) {
console.error('Error:', err);
}`
    };
    
    codeInput.value = examples[code] || code;
}

// 파일 내용 보기
function viewFile(path) {
    fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
            logToConsole(`Error: ${err.message}`, 'error');
            return;
        }
        
        logToConsole(`=== ${path} 내용 ===`);
        logToConsole(data);
        logToConsole('=== 파일 끝 ===');
    });
}

// 폴더 접기/펼치기
function toggleFolder(element) {
    const nested = element.nextElementSibling;
    nested.style.display = nested.style.display === 'none' ? 'block' : 'none';
}

// 로그 값 포맷팅
function formatLogValue(value) {
    if (typeof value === 'object' && value !== null) {
        try {
            return JSON.stringify(value);
        } catch (e) {
            return value.toString();
        }
    }
    return String(value);
}

// 키보드 이벤트 처리
codeInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && event.ctrlKey) {
        executeCode();
    }
});
