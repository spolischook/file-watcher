#!/usr/bin/env node
"use strict";

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const S3 = require('aws-sdk/clients/s3');
const chokidar = require('chokidar');
const DIR    = process.argv[2];
const BUCKET = process.argv[3];

// Check for help
if (!DIR || (DIR && DIR.match(/^-?-?help$/i))) {
  console.log(`
    Usage:
    s3th /path/to/directory/to/follow bucket-name
  `);

  process.exit(1);
}

// Check if path exists
if (!fs.existsSync(DIR)) {
  throw Error(`
    Path "${DIR}" does not exists
  `);
}

const s3 = new S3({
    apiVersion: '2006-03-01',
    params: {Bucket: BUCKET}
});

const s3fs = require('./s3fs')(s3);

localS3Watcher();

async function localS3Watcher() {
    try {
        const s3Files = await s3fs.viewAlbum();
        // console.log('s3Files', s3Files);
        const localFiles = getLocalFilesSync(DIR);
        // console.log('localFiles', localFiles);
        let difference = localFiles.map(f => path.relative(DIR, f)).filter(x => !s3Files.includes(x));
        console.log('difference', difference);
        // let intersection = localFiles.filter(x => s3Files.includes(x));
        // console.log('intersection', intersection);
        await sync(difference);
        watch(DIR, uploadFile)
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }

}

async function sync(localFiles) {
    localFiles.forEach(file => uploadFile(path.resolve(DIR, file)));
}

async function uploadFile(file) {
    if (0 !== file.indexOf(DIR)) {
        throw Error(`File "${file}" not in "${DIR}"`);
    }
    const relativePath = path.relative(DIR, file);
    const albumName = '.' === path.dirname(relativePath) ? null : path.dirname(relativePath);
    s3fs.addPhoto(albumName, file).catch( e => { console.error('There was an error uploading your photo: ', e) } );
}

function extractAllFillesInDirSync(dir) {
    const content = fs.readdirSync(dir, {withFileTypes: true});
    let result = [];
    for (const element of content) {
        const realName = dir + '/' + element.name;
        if (element.isDirectory()) {
            result = result.concat(extractAllFillesInDirSync(realName));
        } else {
            result.push(realName);
        }
    }

    return result;
}

function getLocalFilesSync(dir) {
    return extractAllFillesInDirSync(dir);
    // return files.map(filePath => {
    //     if (0 !== filePath.indexOf(dir)) {
    //         throw Error(`File "${filePath}" not in "${dir}"`);
    //     }
    //     return path.relative(dir, filePath);
    // })
}

function watch (directory, callback) {
    chokidar.watch(directory, {ignoreInitial: true}).on('add', filename => {
        console.log(filename);
        callback(filename);
    });
    // fs.watch(directory, {recursive: true}, (eventType, filename) => {
    //     console.log(`event type is: ${eventType}, filename provided: ${filename}`);
    //     if (!filename) {
    //         return;
    //     }
    //     const filePath = directory.replace(/\/$/, "") + '/' + filename;
    //
    //     setTimeout(async () => {
    //         if (!fs.existsSync(filePath)) return;
    //         if ('change' !== eventType) return;
    //
    //         await callback(filePath);
    //     }, 3000)
    // });
}

