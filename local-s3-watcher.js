#!/usr/bin/env node
"use strict";

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const S3 = require('aws-sdk/clients/s3');
const BUCKET = process.argv[2];
const PATH   = process.argv[3];

// Check for help
if (!PATH || (PATH && PATH.match(/^-?-?help$/i))) {
  console.log(`
    Usage:
    s3th bucket-name /path/to/directory/to/follow
  `);

  process.exit(1);
}

// Check if path exists
if (!fs.existsSync(PATH)) {
  throw Error(`
    Path "${PATH}" does not exists
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
        console.log('s3Files', s3Files);
        const localFiles = getLocalFilesSync(PATH);
        console.log('localFiles', localFiles);
        let difference = localFiles.filter(x => !s3Files.includes(x));
        console.log('difference', difference);
        let intersection = localFiles.filter(x => s3Files.includes(x));
        console.log('intersection', intersection);
        await sync(difference);
        watch(PATH, uploadFile)
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }

}

async function sync(localFiles) {
    localFiles.forEach(async file => {
        const dirName = path.dirname(file) === '.' ? null : path.dirname(file);
        const result = await s3fs.addPhoto(dirName, file).catch( e => { console.error('There was an error uploading your photo: ', e) } );
        console.log(result);
    });
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
    const files = extractAllFillesInDirSync(dir);
    return files.map(filePath => {
        if (0 !== filePath.indexOf(dir)) {
            throw Error(`File "${filePath}" not in "${dir}"`);
        }
        return path.relative(dir, filePath);
    })
}

async function uploadFile(file) {
    console.log(`Got: ${file}`);
    const dirName = path.dirname(file) === '.' ? null : path.dirname(file);
    const result = await s3fs.addPhoto(dirName, file).catch( e => { console.error('There was an error uploading your photo: ', e) } );
}

function watch (directory, callback) {
    fs.watch(directory, (eventType, filename) => {
        console.log(`event type is: ${eventType}, filename provided: ${filename}`);
        if (!filename) {
            return;
        }
        const filePath = directory.replace(/\/$/, "") + '/' + filename;

        setTimeout(async () => {
            if (!fs.existsSync(filePath)) return;
            if ('change' !== eventType) return;

            await callback(filePath);
        }, 3000)
    });
}

