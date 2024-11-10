import fs from 'fs';
import jszip from 'jszip';
import http from 'http';
import https from 'https';
import LoggerFactory, {Logger} from './LoggerFactory';
import {injectable, singleton} from 'tsyringe';

class FileHandlerError extends Error {
    constructor(message: string){
        super(message);
        this.name = 'FileHandlerError';
    }
}

@singleton()
@injectable()
export default class FileHandler {
    private logger: Logger;

    constructor(logger: LoggerFactory) {
        this.logger = logger.createPrivateClassLogger(this.constructor.name);
    }

    public listFilesInDir(dirPath: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(dirPath, (err, files) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files);
                }
            });
        });
    }

    /**
     * recursiveMkdir
     * -------------
     * Creates a directory and any necessary subdirectories.
     * @param dirPath - The directory to create.
     * @returns The path to the created directory.
     * 
     * example usage:
     * ```
     * await fileHandler.recursiveMkdir('./downloads');
     * ```
    */
    public recursiveMkdir(dirPath: string): Promise<string> {
        this.logger.info(`Creating directory ${dirPath}`);

        return new Promise<string>((resolve, reject) => {
            fs.mkdir(dirPath, { recursive: true }, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(dirPath);
                }
            });
        });
    }

    /**
     * downloadFile
     * ------------
     * Downloads a file from a given url and saves it to the destination directory.
     * The desitination directory will be created if it does not exist.
     * @param url - The url of the file to download.
     * @param destinationDir - The directory to save the downloaded file.
     * @returns The path to the downloaded file.
     * 
     * example usage:
     * ```
     * await fileHandler.downloadFile('https://example.com/file.zip', './downloads');
     * ```
    */
    public async downloadFile(requestOptions: https.RequestOptions | http.RequestOptions, destinationDir: string): Promise<string>{
        const protocol = requestOptions.protocol === 'https:' ? https : http;
        const filename = requestOptions.path?.split('/').pop();
        const savePath = `${destinationDir}/${filename}`;

        const fullUrl = `${requestOptions.protocol}//${requestOptions.host}${requestOptions.path}`;

        await this.recursiveMkdir(destinationDir);

        this.logger.info(`Downloading file from ${fullUrl} to ${savePath}`);

        if (!filename){
            throw new FileHandlerError(`Could not get filename from url: ${fullUrl}`);
        }

        return new Promise<string>((resolve, reject) => {

            protocol.get(requestOptions, (res: http.IncomingMessage) => {
                // this.logger.info(res.rawHeaders);

                const fileStream = fs.createWriteStream(savePath);
                res.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve(savePath);
                });

                fileStream.on('error', (err) => {
                    fs.unlink(savePath, () => {
                        reject(err);
                    });
                });
            });
        });
    }

    /**
     * extractZipToDir
     * ---------------
     * Extracts a zip file to a given directory.
     * @param pathToZip - The path to the zip file to extract.
     * @param destinationDir - The directory to extract the zip file to.
     * @returns A promise that resolves when the zip file has been extracted.
     * 
     * example usage:
     * ```
     * await fileHandler.extractZipToDir('file.zip', './extracted');
     * ```
    */
    public extractZipToDir(pathToZip: string, destinationDir: string): Promise<string> {
        this.logger.info(`Extracting zip file ${pathToZip} to ${destinationDir}`);

        return new Promise<string>((resolve, reject) => {
            fs.readFile(pathToZip, async (err, data) => {
                if (err) {
                    reject(err);
                }
                const zip = new jszip();
                const unzipped = await zip.loadAsync(data);

                if (!fs.existsSync(destinationDir)) {
                    await this.recursiveMkdir(destinationDir);
                }

                for (const [path, file] of Object.entries(unzipped.files)) {
                    const content = await file.async('nodebuffer');
                    fs.writeFileSync(`${destinationDir}/${path}`, content);
                }
                resolve(destinationDir);
            });
        });
    }

    /**
     * readFileToBuffer
     * ----------------
     * Reads the contents of a file and returns a promise that resolves with a Buffer of its contents.
     * @param filePath - The path to the file to read.
     * @returns A promise that resolves with a buffer of the file.
     * 
     * example usage:
     * ```
     * const contents = await fileHandler.readFileToBuffer('file.txt');
     * console.log(contents.toString('utf8'));
     * ```
    */
    public readFileToBuffer(filePath: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (
                err: NodeJS.ErrnoException | null,
                data: Buffer
            ) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    /**
     * writeFile
     * ---------
     * Writes data to a file.
     * @param filePath - The path to the file to write.
     * @param data - The data to write to the file.
     * @returns A promise that resolves when the file has been written.
     * 
     * example usage:
     * ```
     * await fileHandler.writeFile('file.txt', 'Hello, world!');
     * ```
    */
    public writeFileFromBuffer(filePath: string, data: Buffer): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, data, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}