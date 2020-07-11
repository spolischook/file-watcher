"use strict";

// const S3 = require('aws-sdk/clients/s3');
// jest.mock('aws-sdk/clients/s3');
//
// beforeEach(() => {
//     // Clear all instances and calls to constructor and all methods:
//     S3.mockClear();
// });

test('viewAlbum', () => {
    // const s3 = new S3();

    var AWSMock = require('mock-aws-s3');
    AWSMock.config.basePath = '/tmp/buckets/' // Can configure a basePath for your local buckets
    var s3 = AWSMock.S3({
        params: { Bucket: 'example' }
    });

    const s3fs = require('../s3fs')(s3);

    s3fs.listAlbums()
        .then()
        .catch(() => {fail('This should never happen')})
    ;
});

