# S3 file uploader

This is command line utility to watch a local directory 
and upload files to selected S3 bucket 

### Configure

Get User with right permission on 
[AWS IAM](https://console.aws.amazon.com/iam/home?region=eu-central-1#/users)  
Add credentials to the `vim ~/.aws/credentials`:

```
[default]
aws_access_key_id = ##SECRET##
aws_secret_access_key = ##SECRET##
```

### Usage

```
node local-s3-watcher.js [full-path-to-dir] [s3-bucket-name]
```


