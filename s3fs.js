const fs = require('fs');
const S3 = require('aws-sdk/clients/s3');

module.exports = (s3) => {
    try {
        if ((!s3 instanceof S3)) throw new Error();
    } catch (e) {
        throw new Error('You should provide valid S3 api object');
    }

    return {
        addPhoto,
        listAlbums,
        viewAlbum,
        createAlbum,
    }

    function addPhoto(albumName, path) {
        const file = fs.createReadStream(path);
        const fileName = path.split("/").pop();
        const albumPhotosKey = albumName ? albumName + '/' : '';

        const photoKey = albumPhotosKey + fileName;

        return new Promise((resolve, reject) => {
            s3.upload({
                Key: photoKey,
                Body: file,
                ACL: 'public-read'
            }, function (err, data) {
                if (err) {
                    reject(err);
                }
                resolve('Success');
            });
        });
    }

    function listAlbums() {
        return new Promise((resolve, reject) => s3.listObjects(function (err, data) {
            if (err) {
                return reject('There was an error listing your albums: ' + err.message);
            }
            resolve(data);
        }));
    }

    function viewAlbum(albumName = null) {
        const albumPhotosKey = albumName ? albumName + '/' : '';

        return new Promise((resolve, reject) => {
            s3.listObjectsV2({Prefix: albumPhotosKey}, function (err, data) {
                if (err) {
                    reject('There was an error viewing your album: ' + err.message);
                }
                resolve(data.Contents.filter(obj => obj.Size > 0).map(obj => obj.Key));
            });
        });
    }

    function createAlbum(albumName) {
        albumName = albumName.trim();

        return new Promise((resolve, reject) => {
            if (!albumName) {
                reject('Album names must contain at least one non-space character.');
            }
            if (albumName.indexOf('/') !== -1) {
                reject('Album names cannot contain slashes.');
            }
            var albumKey = encodeURIComponent(albumName) + '/';
            s3.headObject({Key: albumKey}, function (err, data) {
                if (!err) {
                    reject('Album already exists.');
                }
                if (err.code !== 'NotFound') {
                    reject('There was an error creating your album: ' + err.message);
                }
                s3.putObject({Key: albumKey}, function (err, data) {
                    if (err) {
                        reject('There was an error creating your album: ' + err.message);
                    }
                    resolve();
                });
            });
        });
    }
}


